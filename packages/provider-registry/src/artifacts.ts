import type {
  ProviderRegistryManifest,
  RegistryValidationIssue,
  RegistryValidationResult,
} from './model.js';
import { assertValidProviderRegistry } from './validation.js';
import { validateRegistrySbom } from './sbom.js';

export type RegistryArtifactReader = (path: string) => Promise<string | Uint8Array>;

export interface RegistryArtifactReference {
  readonly path: string;
  readonly sha256: string;
  readonly purpose: 'license' | 'sbom' | 'snapshot' | 'transform' | 'patch';
}

function addReference(
  references: Map<string, RegistryArtifactReference>,
  reference: RegistryArtifactReference,
): void {
  const current = references.get(reference.path);
  if (current && current.sha256 !== reference.sha256) {
    throw new Error(`Registry artifact ${reference.path} has conflicting hashes.`);
  }
  references.set(reference.path, reference);
}

export function collectRegistryArtifactReferences(
  manifest: ProviderRegistryManifest,
): readonly RegistryArtifactReference[] {
  const references = new Map<string, RegistryArtifactReference>();
  addReference(references, {
    path: manifest.sbom.path,
    sha256: manifest.sbom.sha256,
    purpose: 'sbom',
  });
  for (const capability of manifest.capabilities) {
    for (const file of capability.license.files) {
      addReference(references, { path: file.path, sha256: file.sha256, purpose: 'license' });
    }
    if (capability.source.ingestionMode !== 'source_snapshot') continue;
    for (const file of capability.source.closure) {
      addReference(references, {
        path: file.localPath,
        sha256: file.localSha256,
        purpose: 'snapshot',
      });
    }
    for (const transform of capability.source.transforms) {
      addReference(references, {
        path: transform.scriptPath,
        sha256: transform.scriptSha256,
        purpose: 'transform',
      });
    }
    for (const patch of capability.source.patches) {
      addReference(references, { path: patch.path, sha256: patch.sha256, purpose: 'patch' });
    }
  }
  return [...references.values()].sort((left, right) => left.path.localeCompare(right.path));
}

async function sha256(value: string | Uint8Array): Promise<string> {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  const ownedBytes = new Uint8Array(bytes.byteLength);
  ownedBytes.set(bytes);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', ownedBytes.buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyRegistryArtifacts(
  value: unknown,
  readArtifact: RegistryArtifactReader,
): Promise<RegistryValidationResult> {
  try {
    assertValidProviderRegistry(value);
  } catch {
    return {
      success: false,
      issues: [
        {
          code: 'INVALID_MANIFEST',
          path: '$',
          message: 'Artifact verification requires a valid provider registry manifest.',
        },
      ],
    };
  }

  const issues: RegistryValidationIssue[] = [];
  for (const reference of collectRegistryArtifactReferences(value)) {
    try {
      const content = await readArtifact(reference.path);
      const actual = await sha256(content);
      if (actual !== reference.sha256) {
        issues.push({
          code: 'ARTIFACT_HASH_MISMATCH',
          path: reference.path,
          message: `${reference.purpose} artifact hash does not match the Git-authoritative manifest.`,
        });
      } else if (reference.purpose === 'sbom') {
        try {
          const text = typeof content === 'string' ? content : new TextDecoder().decode(content);
          issues.push(...validateRegistrySbom(value, JSON.parse(text) as unknown).issues);
        } catch {
          issues.push({
            code: 'SBOM_INVALID',
            path: reference.path,
            message: 'SBOM artifact is not valid JSON.',
          });
        }
      }
    } catch {
      issues.push({
        code: 'ARTIFACT_UNREADABLE',
        path: reference.path,
        message: `${reference.purpose} artifact could not be read.`,
      });
    }
  }
  return { success: issues.length === 0, issues };
}

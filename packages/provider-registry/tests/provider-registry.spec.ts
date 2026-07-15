import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildProviderRegistryReadModel,
  getProviderOfRecord,
  isExactPackageVersion,
  validateCapabilityMigrationMatrix,
  validateRegistrySbom,
  validateProviderRegistry,
  verifyRegistryArtifacts,
  verifyRuntimeProviderPins,
  type ProviderRegistryManifest,
} from '../src/index.js';

type MutableJson = Record<string, unknown>;

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = resolve(packageRoot, 'registry/provider-registry.v1.json');
const schemaPath = resolve(packageRoot, 'registry/provider-registry.schema.json');
const matrixPath = resolve(packageRoot, 'registry/capability-migration-matrix.v1.json');
const matrixSchemaPath = resolve(packageRoot, 'registry/capability-migration-matrix.schema.json');

function asObject(value: unknown): MutableJson {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Fixture value is not an object.');
  }
  return value as MutableJson;
}

function asArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('Fixture value is not an array.');
  return value;
}

async function loadJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

async function mutableManifest(): Promise<MutableJson> {
  return asObject(structuredClone(await loadJson(manifestPath)));
}

function firstCapability(manifest: MutableJson): MutableJson {
  const value = asArray(manifest.capabilities)[0];
  return asObject(value);
}

function issueCodes(value: unknown): readonly string[] {
  return validateProviderRegistry(value).issues.map((issue) => issue.code);
}

function parseCatalog(workspaceYaml: string): Readonly<Record<string, string>> {
  const catalog: Record<string, string> = {};
  let inCatalog = false;
  for (const line of workspaceYaml.split('\n')) {
    if (line === 'catalog:') {
      inCatalog = true;
      continue;
    }
    if (inCatalog && /^\S/.test(line)) break;
    if (!inCatalog) continue;
    const match = line.match(/^\s{2}(?:"([^"]+)"|([^:]+)):\s+"?([^"\s]+)"?$/);
    if (!match) continue;
    const name = match[1] ?? match[2];
    const version = match[3];
    if (name && version) catalog[name] = version;
  }
  return catalog;
}

function lockIntegrity(lockfile: string, packageName: string, version: string): string | undefined {
  const header = packageName.startsWith('@')
    ? `  '${packageName}@${version}':`
    : `  ${packageName}@${version}:`;
  const start = lockfile.indexOf(header);
  if (start === -1) return undefined;
  return lockfile.slice(start, start + 800).match(/resolution: \{integrity: ([^}]+)\}/)?.[1];
}

describe('Git-authoritative provider registry', () => {
  it('classifies all 131 catalog capabilities with final exports, migration impact, and proof', async () => {
    const matrix = asObject(await loadJson(matrixPath));
    expect(validateCapabilityMigrationMatrix(matrix)).toEqual({ success: true, issues: [] });
    const records = asArray(matrix.capabilities).map(asObject);
    expect(matrix.catalogCount).toBe(131);
    expect(records).toHaveLength(131);
    expect(records.filter((entry) => entry.disposition === 'keep-provider-backed')).toHaveLength(31);
    expect(records.filter((entry) => entry.disposition === 'native-with-rationale')).toHaveLength(100);
    expect(new Set(records.map((entry) => entry.catalogSlug)).size).toBe(131);
    const exports = records.flatMap((entry) => asArray(entry.finalPublicExports));
    expect(new Set(exports).size).toBe(exports.length);
    expect(
      records.every(
        (entry) =>
          asObject(entry.migration).targetPackageVersion === '0.3.0' &&
          asArray(entry.conformanceProof).length > 0,
      ),
    ).toBe(true);
  });

  it('fails a provider-backed matrix row without an immutable provider pin', async () => {
    const matrix = asObject(structuredClone(await loadJson(matrixPath)));
    const providerBacked = asArray(matrix.capabilities)
      .map(asObject)
      .find((entry) => entry.disposition === 'keep-provider-backed');
    if (!providerBacked) throw new Error('Missing provider-backed fixture row.');
    asObject(providerBacked.provider).packageVersion = 'latest';
    expect(validateCapabilityMigrationMatrix(matrix).issues).toContainEqual(
      expect.objectContaining({ code: 'MATRIX_PROVIDER_PIN' }),
    );
  });

  it('accepts the checked-in manifest and exposes one sorted provider of record per capability', async () => {
    const manifest = await loadJson(manifestPath);
    const result = validateProviderRegistry(manifest);
    expect(result).toEqual({ success: true, issues: [] });

    const readModel = buildProviderRegistryReadModel(manifest);
    expect(readModel.authority).toEqual({
      kind: 'git_manifest',
      repository: 'https://github.com/lemn-ltd/ui',
      path: 'packages/provider-registry/registry/provider-registry.v1.json',
    });
    expect(readModel.capabilities).toHaveLength(9);
    expect(readModel.capabilities.map((capability) => capability.capabilityId)).toEqual(
      [...readModel.capabilities.map((capability) => capability.capabilityId)].sort(),
    );
    expect(readModel.capabilities.map((capability) => capability.license.spdx)).toEqual(
      expect.arrayContaining(['Apache-2.0', 'MIT']),
    );
    expect(readModel.capabilities.every((capability) => capability.upstream.updateStatus !== 'unknown')).toBe(true);
  });

  it('resolves the exact provider of record without leaking a fallback selection', async () => {
    const manifest = (await loadJson(manifestPath)) as ProviderRegistryManifest;
    const checkbox = getProviderOfRecord(manifest, 'ui.primitive.checkbox');
    expect(checkbox.provider.id).toBe('radix-ui');
    expect(checkbox.source).toMatchObject({
      ingestionMode: 'runtime_dependency',
      packageName: 'radix-ui',
      packageVersion: '1.4.3',
    });
    expect(() => getProviderOfRecord(manifest, 'ui.primitive.missing')).toThrow(
      'must resolve to exactly one provider of record',
    );
  });

  it('selects Apache ECharts only for HeatmapChart and captures its NOTICE obligations', async () => {
    const manifest = (await loadJson(manifestPath)) as ProviderRegistryManifest;
    const heatmap = getProviderOfRecord(manifest, 'ui.visualization.heatmap-chart');
    expect(heatmap).toMatchObject({
      publicExport: 'HeatmapChart',
      provider: { id: 'apache-echarts' },
      source: {
        ingestionMode: 'runtime_dependency',
        packageName: 'echarts',
        packageVersion: '6.1.0',
      },
      license: { spdx: 'Apache-2.0' },
      upstream: { updateStatus: 'current' },
    });
    expect(heatmap.license.files.map((file) => file.kind)).toContain('NOTICE');
    expect(
      manifest.capabilities.filter(
        (capability) => capability.lifecycle === 'active' && capability.publicExport === 'HeatmapChart',
      ),
    ).toHaveLength(1);
  });

  it('verifies every captured license against the hashes in the manifest', async () => {
    const manifest = await loadJson(manifestPath);
    const result = await verifyRegistryArtifacts(manifest, (path) => readFile(resolve(packageRoot, path)));
    expect(result).toEqual({ success: true, issues: [] });
  });

  it('keeps the SPDX package versions and licenses aligned with runtime provider pins', async () => {
    const manifest = (await loadJson(manifestPath)) as ProviderRegistryManifest;
    const sbomPath = resolve(packageRoot, manifest.sbom.path);
    const sbom = await loadJson(sbomPath);
    expect(validateRegistrySbom(manifest, sbom)).toEqual({ success: true, issues: [] });

    const staleSbom = structuredClone(asObject(sbom));
    const packages = asArray(staleSbom.packages);
    const radixPackage = packages.map(asObject).find((entry) => entry.name === 'radix-ui');
    if (!radixPackage) throw new Error('Missing Radix fixture package.');
    radixPackage.versionInfo = '1.4.2';
    expect(validateRegistrySbom(manifest, staleSbom).issues).toContainEqual(
      expect.objectContaining({ code: 'SBOM_PROVIDER_VERSION' }),
    );
  });

  it('matches every runtime provider pin to the UI manifest, installed tree, and lock integrity', async () => {
    const repoRoot = resolve(packageRoot, '../..');
    const manifest = (await loadJson(manifestPath)) as ProviderRegistryManifest;
    const uiPackage = asObject(await loadJson(resolve(repoRoot, 'packages/ui/package.json')));
    const workspaceYaml = await readFile(resolve(repoRoot, 'pnpm-workspace.yaml'), 'utf8');
    const lockfile = await readFile(resolve(repoRoot, 'pnpm-lock.yaml'), 'utf8');
    const catalog = parseCatalog(workspaceYaml);
    const installedVersions: Record<string, string> = {};
    const lockIntegrities: Record<string, string> = {};
    for (const capability of manifest.capabilities) {
      if (capability.source.ingestionMode !== 'runtime_dependency') continue;
      const packageName = capability.source.packageName;
      const installedPackage = asObject(
        await loadJson(resolve(repoRoot, 'packages/ui/node_modules', packageName, 'package.json')),
      );
      if (typeof installedPackage.version === 'string') installedVersions[packageName] = installedPackage.version;
      const integrity = lockIntegrity(lockfile, packageName, capability.source.packageVersion);
      if (integrity) lockIntegrities[packageName] = integrity;
    }
    const evidence = {
      dependencies: asObject(uiPackage.dependencies) as Record<string, string>,
      peerDependencies: asObject(uiPackage.peerDependencies) as Record<string, string>,
      catalog,
      installedVersions,
      lockIntegrities,
    };
    expect(verifyRuntimeProviderPins(manifest, evidence)).toEqual({ success: true, issues: [] });

    expect(
      verifyRuntimeProviderPins(manifest, {
        ...evidence,
        installedVersions: { ...installedVersions, recharts: '3.9.1' },
      }).issues,
    ).toContainEqual(expect.objectContaining({ code: 'RUNTIME_INSTALL_DRIFT', path: 'recharts' }));
  });

  it('keeps every adapter, conformance record, authority path, and package path resolvable', async () => {
    const repoRoot = resolve(packageRoot, '../..');
    const manifest = (await loadJson(manifestPath)) as ProviderRegistryManifest;
    await expect(readFile(resolve(repoRoot, manifest.sourceOfTruth.path))).resolves.toBeDefined();
    for (const capability of manifest.capabilities) {
      await expect(readFile(resolve(repoRoot, capability.adapters.publicApi))).resolves.toBeDefined();
      if (capability.adapters.theme) {
        await expect(readFile(resolve(repoRoot, capability.adapters.theme))).resolves.toBeDefined();
      }
      for (const paths of Object.values(capability.conformance)) {
        for (const path of paths) {
          await expect(readFile(resolve(repoRoot, path))).resolves.toBeDefined();
        }
      }
      if (capability.source.ingestionMode === 'runtime_dependency') {
        for (const path of capability.source.packagePaths) {
          await expect(
            readFile(resolve(repoRoot, 'packages/ui/node_modules', capability.source.packageName, path)),
          ).resolves.toBeDefined();
        }
      }
    }
  });

  it('detects a modified or missing captured artifact', async () => {
    const manifest = await loadJson(manifestPath);
    const modified = await verifyRegistryArtifacts(manifest, async (path) => {
      if (path.includes('radix-ui')) return 'modified';
      return readFile(resolve(packageRoot, path));
    });
    expect(modified.success).toBe(false);
    expect(modified.issues).toContainEqual(
      expect.objectContaining({ code: 'ARTIFACT_HASH_MISMATCH' }),
    );

    const missing = await verifyRegistryArtifacts(manifest, async () => {
      throw new Error('missing');
    });
    expect(missing.success).toBe(false);
    expect(missing.issues.every((issue) => issue.code === 'ARTIFACT_UNREADABLE')).toBe(true);
  });

  it.each(['latest', '^1.4.3', '~1.4.3', '*', '>=1.0.0', 'workspace:*']) (
    'rejects the unpinned provider version %s',
    async (version) => {
      const manifest = await mutableManifest();
      const source = asObject(firstCapability(manifest).source);
      source.packageVersion = version;
      expect(issueCodes(manifest)).toContain('UNPINNED_VERSION');
    },
  );

  it.each(['1.4.3', '1.4.3-rc.1', '1.4.3+build.7']) (
    'accepts exact semantic version %s',
    (version) => {
      expect(isExactPackageVersion(version)).toBe(true);
    },
  );

  it('rejects two active implementations or providers of record for one capability', async () => {
    const manifest = await mutableManifest();
    const capabilities = asArray(manifest.capabilities);
    const duplicate = structuredClone(firstCapability(manifest));
    duplicate.implementationId = 'other.checkbox@1.0.0';
    capabilities.push(duplicate);

    const codes = issueCodes(manifest);
    expect(codes).toContain('ACTIVE_IMPLEMENTATION_COUNT');
    expect(codes).toContain('PROVIDER_OF_RECORD_COUNT');
  });

  it('rejects two active capabilities that claim the same public export', async () => {
    const manifest = await mutableManifest();
    const capabilities = asArray(manifest.capabilities);
    const second = asObject(capabilities[1]);
    second.publicExport = firstCapability(manifest).publicExport;
    expect(issueCodes(manifest)).toContain('DUPLICATE_PUBLIC_EXPORT');
  });

  it('rejects version splits for the same runtime provider package', async () => {
    const manifest = await mutableManifest();
    const capabilities = asArray(manifest.capabilities);
    const secondCapability = structuredClone(firstCapability(manifest));
    secondCapability.capabilityId = 'ui.primitive.checkbox-card';
    secondCapability.implementationId = 'radix-ui.checkbox-card@1.4.2';
    secondCapability.publicExport = 'CheckboxCard';
    asObject(secondCapability.source).packageVersion = '1.4.2';
    capabilities.push(secondCapability);
    expect(issueCodes(manifest)).toContain('PROVIDER_VERSION_SPLIT');
  });

  it('retains historical provider provenance without treating it as an installed active pin', async () => {
    const manifest = await mutableManifest();
    const retired = structuredClone(firstCapability(manifest));
    retired.implementationId = 'radix-ui.checkbox@1.4.2';
    retired.lifecycle = 'retired';
    retired.providerOfRecord = false;
    asObject(retired.source).packageVersion = '1.4.2';
    asArray(manifest.capabilities).push(retired);
    expect(validateProviderRegistry(manifest).success).toBe(true);
  });

  it('rejects denied, unknown, and unreviewed manual licenses', async () => {
    const denied = await mutableManifest();
    const deniedLicense = asObject(firstCapability(denied).license);
    deniedLicense.spdx = 'AGPL-3.0-only';
    deniedLicense.reviewClass = 'denied';
    expect(issueCodes(denied)).toContain('LICENSE_DENIED');

    const unknown = await mutableManifest();
    asObject(firstCapability(unknown).license).spdx = 'LicenseRef-Mystery';
    expect(issueCodes(unknown)).toContain('LICENSE_UNKNOWN');

    const manual = await mutableManifest();
    const manualLicense = asObject(firstCapability(manual).license);
    manualLicense.spdx = 'MPL-2.0';
    manualLicense.reviewClass = 'manual';
    expect(issueCodes(manual)).toContain('LEGAL_REVIEW_REQUIRED');
  });

  it('accepts an unusual SPDX expression only after explicit manual legal approval', async () => {
    const manifest = await mutableManifest();
    const license = asObject(firstCapability(manifest).license);
    license.spdx = 'LicenseRef-Reviewed-Exception';
    license.reviewClass = 'manual';
    license.legalReview = {
      decision: 'approved',
      reviewId: 'LEGAL-2026-0042',
      reviewedAt: '2026-07-15T12:00:00Z',
      reviewerRole: 'legal-counsel',
    };
    expect(validateProviderRegistry(manifest).success).toBe(true);

    license.spdx = 'MIT OR AGPL-3.0-only';
    expect(issueCodes(manifest)).toContain('LICENSE_DENIED');
  });

  it('rejects policy weakening and unknown fields', async () => {
    const manifest = await mutableManifest();
    const policy = asObject(manifest.licensePolicy);
    asArray(policy.denied).pop();
    firstCapability(manifest).silentProviderOverride = true;

    const codes = issueCodes(manifest);
    expect(codes).toContain('LICENSE_POLICY_DRIFT');
    expect(codes).toContain('UNKNOWN_FIELD');
  });

  it('requires immutable full-SHA source snapshots with complete closure', async () => {
    const valid = await mutableManifest();
    firstCapability(valid).source = {
      ingestionMode: 'source_snapshot',
      commitSha: 'a'.repeat(40),
      selectedSourcePaths: ['upstream/checkbox.tsx'],
      closure: [
        {
          upstreamPath: 'upstream/checkbox.tsx',
          localPath: 'third-party/snapshots/checkbox.tsx',
          upstreamSha256: 'b'.repeat(64),
          localSha256: 'c'.repeat(64),
        },
      ],
      transforms: [],
      patches: [],
    };
    expect(validateProviderRegistry(valid).success).toBe(true);

    const shortSha = structuredClone(valid);
    asObject(firstCapability(shortSha).source).commitSha = 'abc123';
    expect(issueCodes(shortSha)).toContain('STRING_FORMAT');

    const missingClosure = structuredClone(valid);
    asObject(firstCapability(missingClosure).source).selectedSourcePaths = ['upstream/helper.ts'];
    expect(issueCodes(missingClosure)).toContain('SNAPSHOT_CLOSURE_MISSING');
  });

  it('rejects repository path traversal in adapter and license records', async () => {
    const manifest = await mutableManifest();
    asObject(firstCapability(manifest).adapters).publicApi = '../../outside.ts';
    const license = asObject(firstCapability(manifest).license);
    const artifact = asObject(asArray(license.files)[0]);
    artifact.path = '/tmp/LICENSE';
    const codes = issueCodes(manifest);
    expect(codes).toContain('UNSAFE_PATH');
    expect(codes).toContain('LICENSE_PATH');
  });

  it('keeps proposals outside the active schema and requires replacement governance', async () => {
    const manifest = await mutableManifest();
    manifest.proposals = [];
    expect(issueCodes(manifest)).toContain('UNKNOWN_FIELD');

    const governed = await mutableManifest();
    firstCapability(governed).replacement = {
      supersedesImplementationId: 'legacy.checkbox@1.0.0',
      adrPath: 'docs/decisions/checkbox-provider.md',
      apiBehaviorVisualDeltaPath: 'docs/migrations/checkbox-delta.md',
      migrationNotesPath: 'docs/migrations/checkbox.md',
      semverImpact: 'major',
    };
    expect(validateProviderRegistry(governed).success).toBe(true);
  });

  it('ships a strict machine-readable JSON Schema beside the authority manifest', async () => {
    const schema = asObject(await loadJson(schemaPath));
    expect(schema.$id).toBe('https://schemas.ui.le-mn.com/provider-registry/v1.json');
    expect(schema.additionalProperties).toBe(false);
    const definitions = asObject(schema.$defs);
    expect(asObject(definitions.capability).additionalProperties).toBe(false);
    expect(asObject(asObject(definitions.capability).properties).source).toBeDefined();

    const matrixSchema = asObject(await loadJson(matrixSchemaPath));
    expect(matrixSchema.$id).toBe(
      'https://schemas.ui.le-mn.com/provider-registry/capability-migration-matrix/v1.json',
    );
    expect(matrixSchema.additionalProperties).toBe(false);
  });
});

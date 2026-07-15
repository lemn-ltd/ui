import type {
  ProviderRegistryManifest,
  RegistryValidationIssue,
  RegistryValidationResult,
} from './model.js';

export interface RuntimeProviderDependencyEvidence {
  readonly dependencies: Readonly<Record<string, string | undefined>>;
  readonly peerDependencies: Readonly<Record<string, string | undefined>>;
  readonly catalog: Readonly<Record<string, string | undefined>>;
  readonly installedVersions: Readonly<Record<string, string | undefined>>;
  readonly lockIntegrities: Readonly<Record<string, string | undefined>>;
}

function resolveDeclaration(
  declaration: string | undefined,
  packageName: string,
  catalog: RuntimeProviderDependencyEvidence['catalog'],
): string | undefined {
  if (declaration === 'catalog:') return catalog[packageName];
  return declaration;
}

export function verifyRuntimeProviderPins(
  manifest: ProviderRegistryManifest,
  evidence: RuntimeProviderDependencyEvidence,
): RegistryValidationResult {
  const issues: RegistryValidationIssue[] = [];
  const checked = new Set<string>();
  for (const capability of manifest.capabilities) {
    if (capability.lifecycle !== 'active' || capability.source.ingestionMode !== 'runtime_dependency') continue;
    const source = capability.source;
    if (checked.has(source.packageName)) continue;
    checked.add(source.packageName);
    const declaredIn = source.dependencyMode === 'peer_dependency'
      ? evidence.peerDependencies
      : evidence.dependencies;
    const declared = resolveDeclaration(declaredIn[source.packageName], source.packageName, evidence.catalog);
    if (declared !== source.packageVersion) {
      issues.push({
        code: 'RUNTIME_DECLARATION_DRIFT',
        path: source.packageName,
        message: `Expected declared version ${source.packageVersion}; found ${declared ?? 'missing'}.`,
      });
    }
    const installed = evidence.installedVersions[source.packageName];
    if (installed !== source.packageVersion) {
      issues.push({
        code: 'RUNTIME_INSTALL_DRIFT',
        path: source.packageName,
        message: `Expected installed version ${source.packageVersion}; found ${installed ?? 'missing'}.`,
      });
    }
    const integrity = evidence.lockIntegrities[source.packageName];
    if (integrity !== source.packageIntegrity) {
      issues.push({
        code: 'RUNTIME_INTEGRITY_DRIFT',
        path: source.packageName,
        message: 'Lockfile integrity does not match the Git-authoritative provider registry.',
      });
    }
  }
  return { success: issues.length === 0, issues };
}

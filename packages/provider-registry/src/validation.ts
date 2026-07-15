import {
  PROVIDER_REGISTRY_SCHEMA_URI,
  PROVIDER_REGISTRY_SCHEMA_VERSION,
  type ProviderRegistryManifest,
  type RegistryValidationIssue,
  type RegistryValidationResult,
} from './model.js';
import { validateCapability, validateRegistryInvariants } from './validation-capability.js';
import { validateLicensePolicy, validateSbomMetadata } from './validation-license.js';
import {
  SLUG,
  addIssue,
  isExactPackageVersion,
  isSafeRepositoryPath,
  rejectUnknownKeys,
  requireLiteral,
  requireObject,
  requireString,
  validateHttpsUrl,
} from './validation-support.js';

const ROOT_KEYS = [
  '$schema',
  'schemaVersion',
  'registryId',
  'revision',
  'sourceOfTruth',
  'licensePolicy',
  'sbom',
  'capabilities',
] as const;

export { isExactPackageVersion } from './validation-support.js';

function validateAuthority(value: unknown, path: string, issues: RegistryValidationIssue[]): void {
  const authority = requireObject(value, path, issues);
  if (!authority) return;
  rejectUnknownKeys(authority, ['kind', 'repository', 'path'], path, issues);
  requireLiteral(authority, 'kind', 'git_manifest', path, issues);
  validateHttpsUrl(requireString(authority, 'repository', path, issues), `${path}.repository`, issues);
  const manifestPath = requireString(authority, 'path', path, issues);
  if (manifestPath && !isSafeRepositoryPath(manifestPath)) {
    addIssue(issues, 'UNSAFE_PATH', `${path}.path`, 'Expected a normalized repository-relative path.');
  }
}

export function validateProviderRegistry(value: unknown): RegistryValidationResult {
  const issues: RegistryValidationIssue[] = [];
  const manifest = requireObject(value, '$', issues);
  if (!manifest) return { success: false, issues };

  rejectUnknownKeys(manifest, ROOT_KEYS, '$', issues);
  requireLiteral(manifest, '$schema', PROVIDER_REGISTRY_SCHEMA_URI, '$', issues);
  requireLiteral(manifest, 'schemaVersion', PROVIDER_REGISTRY_SCHEMA_VERSION, '$', issues);
  requireString(manifest, 'registryId', '$', issues, { pattern: SLUG });
  const revision = requireString(manifest, 'revision', '$', issues);
  if (revision && !isExactPackageVersion(revision)) {
    addIssue(issues, 'UNPINNED_VERSION', '$.revision', 'Registry revision must be exact semantic version.');
  }
  validateAuthority(manifest.sourceOfTruth, '$.sourceOfTruth', issues);
  validateLicensePolicy(manifest.licensePolicy, '$.licensePolicy', issues);
  validateSbomMetadata(manifest.sbom, '$.sbom', issues);

  const capabilities = manifest.capabilities;
  if (!Array.isArray(capabilities) || capabilities.length === 0) {
    addIssue(issues, 'CAPABILITIES_REQUIRED', '$.capabilities', 'At least one capability is required.');
  } else {
    capabilities.forEach((capability, index) => {
      validateCapability(capability, `$.capabilities[${index}]`, issues);
    });
    validateRegistryInvariants(capabilities, issues);
  }

  return { success: issues.length === 0, issues };
}

export function assertValidProviderRegistry(value: unknown): asserts value is ProviderRegistryManifest {
  const result = validateProviderRegistry(value);
  if (result.success) return;
  const detail = result.issues.map((issue) => `${issue.path} [${issue.code}] ${issue.message}`).join('\n');
  throw new Error(`Invalid provider registry manifest:\n${detail}`);
}

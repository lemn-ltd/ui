import type { RegistryValidationIssue, RegistryValidationResult } from './model.js';
import { isExactPackageVersion } from './validation-support.js';

export const CAPABILITY_MIGRATION_MATRIX_SCHEMA_URI =
  'https://schemas.ui.le-mn.com/provider-registry/capability-migration-matrix/v1.json' as const;

export type CapabilityDisposition =
  | 'keep-provider-backed'
  | 'replace'
  | 'native-with-rationale'
  | 'remove';

export interface MatrixProviderReference {
  readonly implementationId: string;
  readonly id: string;
  readonly name: string;
  readonly repository: string;
  readonly ingestionMode: 'runtime_dependency' | 'source_snapshot';
  readonly packageName?: string;
  readonly packageVersion?: string;
  readonly packageIntegrity?: string;
  readonly commitSha?: string;
}

export interface CapabilityMigrationMatrixRecord {
  readonly catalogSlug: string;
  readonly capabilityId: string;
  readonly finalCapabilityId: string;
  readonly finalPublicExports: readonly string[];
  readonly disposition: CapabilityDisposition;
  readonly provider?: MatrixProviderReference;
  readonly nativeRationale?: string;
  readonly migration: {
    readonly status: 'complete' | 'planned';
    readonly publicVersionEffect: 'none' | 'patch' | 'minor' | 'major';
    readonly targetPackageVersion: string;
    readonly summary: string;
  };
  readonly conformanceProof: readonly string[];
}

export interface CapabilityMigrationMatrix {
  readonly $schema: typeof CAPABILITY_MIGRATION_MATRIX_SCHEMA_URI;
  readonly schemaVersion: 1;
  readonly matrixId: 'lemn-ui-provider-first-cutover';
  readonly catalogCount: number;
  readonly targetPackage: '@lemn-ltd/ui';
  readonly targetPackageVersion: string;
  readonly capabilities: readonly CapabilityMigrationMatrixRecord[];
}

function issue(code: string, path: string, message: string): RegistryValidationIssue {
  return { code, path, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyStrings(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === 'string' && entry.length > 0);
}

export function validateCapabilityMigrationMatrix(value: unknown): RegistryValidationResult {
  const issues: RegistryValidationIssue[] = [];
  if (!isRecord(value)) {
    return { success: false, issues: [issue('MATRIX_INVALID', '$', 'Migration matrix must be an object.')] };
  }
  if (value.$schema !== CAPABILITY_MIGRATION_MATRIX_SCHEMA_URI) {
    issues.push(issue('MATRIX_SCHEMA', '$.$schema', 'Migration matrix schema URI is not canonical.'));
  }
  if (value.schemaVersion !== 1) issues.push(issue('MATRIX_VERSION', '$.schemaVersion', 'Expected schema version 1.'));
  if (value.matrixId !== 'lemn-ui-provider-first-cutover') issues.push(issue('MATRIX_ID', '$.matrixId', 'Matrix ID is not canonical.'));
  if (value.targetPackage !== '@lemn-ltd/ui') issues.push(issue('MATRIX_PACKAGE', '$.targetPackage', 'Matrix must target @lemn-ltd/ui.'));
  if (typeof value.targetPackageVersion !== 'string' || !isExactPackageVersion(value.targetPackageVersion)) {
    issues.push(issue('MATRIX_TARGET_VERSION', '$.targetPackageVersion', 'Target package version must be exact.'));
  }
  if (!Array.isArray(value.capabilities)) {
    issues.push(issue('MATRIX_CAPABILITIES', '$.capabilities', 'Capabilities must be an array.'));
    return { success: false, issues };
  }
  if (value.catalogCount !== value.capabilities.length) {
    issues.push(issue('MATRIX_COUNT', '$.catalogCount', 'Catalog count must equal the number of classified capabilities.'));
  }

  const slugs = new Set<string>();
  const capabilityIds = new Set<string>();
  const allowedDispositions = new Set<CapabilityDisposition>([
    'keep-provider-backed', 'replace', 'native-with-rationale', 'remove',
  ]);
  value.capabilities.forEach((entry, index) => {
    const path = `$.capabilities[${index}]`;
    if (!isRecord(entry)) {
      issues.push(issue('MATRIX_RECORD', path, 'Capability classification must be an object.'));
      return;
    }
    for (const [key, seen] of [['catalogSlug', slugs], ['capabilityId', capabilityIds]] as const) {
      const field = entry[key];
      if (typeof field !== 'string' || field.length === 0) {
        issues.push(issue('MATRIX_REQUIRED_STRING', `${path}.${key}`, `${key} is required.`));
      } else if (seen.has(field)) {
        issues.push(issue('MATRIX_DUPLICATE', `${path}.${key}`, `${key} must be unique.`));
      } else seen.add(field);
    }
    if (typeof entry.finalCapabilityId !== 'string' || entry.finalCapabilityId.length === 0) {
      issues.push(issue('MATRIX_FINAL_CAPABILITY', `${path}.finalCapabilityId`, 'Final capability ID is required.'));
    }
    if (!nonEmptyStrings(entry.finalPublicExports)) {
      issues.push(issue('MATRIX_EXPORTS', `${path}.finalPublicExports`, 'At least one final public export is required.'));
    }
    const disposition = entry.disposition as CapabilityDisposition;
    if (!allowedDispositions.has(disposition)) {
      issues.push(issue('MATRIX_DISPOSITION', `${path}.disposition`, 'Disposition is not supported.'));
    }
    if (disposition === 'keep-provider-backed' || disposition === 'replace') {
      if (!isRecord(entry.provider)) {
        issues.push(issue('MATRIX_PROVIDER', `${path}.provider`, 'Provider-backed decisions require exact provider evidence.'));
      } else if (typeof entry.provider.implementationId !== 'string' || entry.provider.implementationId.length === 0) {
        issues.push(issue('MATRIX_PROVIDER_IMPLEMENTATION', `${path}.provider.implementationId`, 'Provider implementation ID is required.'));
      } else if (entry.provider.ingestionMode === 'runtime_dependency') {
        if (
          typeof entry.provider.packageName !== 'string' ||
          typeof entry.provider.packageVersion !== 'string' ||
          !isExactPackageVersion(entry.provider.packageVersion) ||
          typeof entry.provider.packageIntegrity !== 'string' ||
          !/^sha512-[A-Za-z0-9+/]+={0,2}$/u.test(entry.provider.packageIntegrity)
        ) {
          issues.push(issue('MATRIX_PROVIDER_PIN', `${path}.provider`, 'Runtime providers require package name, exact version, and sha512 integrity.'));
        }
      } else if (entry.provider.ingestionMode === 'source_snapshot') {
        if (typeof entry.provider.commitSha !== 'string' || !/^[a-f0-9]{40}$/u.test(entry.provider.commitSha)) {
          issues.push(issue('MATRIX_PROVIDER_SHA', `${path}.provider.commitSha`, 'Source providers require a full commit SHA.'));
        }
      } else {
        issues.push(issue('MATRIX_PROVIDER_MODE', `${path}.provider.ingestionMode`, 'Provider ingestion mode is invalid.'));
      }
      if (entry.nativeRationale !== undefined) issues.push(issue('MATRIX_PROVIDER_NATIVE_CONFLICT', path, 'Provider decisions cannot also declare a native rationale.'));
    }
    if (disposition === 'native-with-rationale') {
      if (typeof entry.nativeRationale !== 'string' || entry.nativeRationale.length < 40) {
        issues.push(issue('MATRIX_NATIVE_RATIONALE', `${path}.nativeRationale`, 'Native decisions require a substantive rationale.'));
      }
      if (entry.provider !== undefined) issues.push(issue('MATRIX_NATIVE_PROVIDER_CONFLICT', path, 'Native decisions cannot declare a provider.'));
    }
    if (!isRecord(entry.migration)) {
      issues.push(issue('MATRIX_MIGRATION', `${path}.migration`, 'Migration evidence is required.'));
    } else if (
      (entry.migration.status !== 'complete' && entry.migration.status !== 'planned') ||
      !['none', 'patch', 'minor', 'major'].includes(String(entry.migration.publicVersionEffect)) ||
      typeof entry.migration.targetPackageVersion !== 'string' ||
      !isExactPackageVersion(entry.migration.targetPackageVersion) ||
      typeof entry.migration.summary !== 'string' ||
      entry.migration.summary.length < 20
    ) {
      issues.push(issue('MATRIX_MIGRATION_INVALID', `${path}.migration`, 'Migration status, exact target version, SemVer effect, and summary are required.'));
    }
    if (!nonEmptyStrings(entry.conformanceProof)) {
      issues.push(issue('MATRIX_CONFORMANCE', `${path}.conformanceProof`, 'At least one conformance proof path is required.'));
    }
  });

  return { success: issues.length === 0, issues };
}

export function assertValidCapabilityMigrationMatrix(
  value: unknown,
): asserts value is CapabilityMigrationMatrix {
  const result = validateCapabilityMigrationMatrix(value);
  if (!result.success) {
    throw new Error(result.issues.map((entry) => `${entry.path}: ${entry.message}`).join('\n'));
  }
}

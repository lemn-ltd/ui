import type { RegistryValidationIssue } from './model.js';
import { validateLicense } from './validation-license.js';
import {
  validateAdapters,
  validateConformance,
  validateProvider,
  validateReplacement,
  validateSource,
  validateUpstream,
} from './validation-source.js';
import {
  CAPABILITY_ID,
  IDENTIFIER,
  IMPLEMENTATION_ID,
  SLUG,
  TOKEN_ROLE,
  addIssue,
  isObject,
  rejectUnknownKeys,
  requireBoolean,
  requireEnum,
  requireObject,
  requireString,
  requireStringArray,
  type JsonObject,
} from './validation-support.js';

export function validateCapability(
  value: unknown,
  path: string,
  issues: RegistryValidationIssue[],
): void {
  const capability = requireObject(value, path, issues);
  if (!capability) return;
  const keys = [
    'capabilityId',
    'implementationId',
    'publicExport',
    'category',
    'maturity',
    'lifecycle',
    'providerOfRecord',
    'provider',
    'source',
    'license',
    'adapters',
    'brandTokenRoles',
    'conformance',
    'upstream',
    'replacement',
  ] as const;
  rejectUnknownKeys(capability, keys, path, issues);
  requireString(capability, 'capabilityId', path, issues, { pattern: CAPABILITY_ID });
  requireString(capability, 'implementationId', path, issues, { pattern: IMPLEMENTATION_ID });
  requireString(capability, 'publicExport', path, issues, { pattern: IDENTIFIER });
  requireString(capability, 'category', path, issues, { pattern: SLUG });
  requireEnum(capability, 'maturity', ['experimental', 'beta', 'stable', 'deprecated'], path, issues);
  const lifecycle = requireEnum(capability, 'lifecycle', ['active', 'retired'], path, issues);
  const providerOfRecord = requireBoolean(capability, 'providerOfRecord', path, issues);
  if (lifecycle === 'active' && providerOfRecord !== true) {
    addIssue(issues, 'ACTIVE_NOT_PROVIDER_OF_RECORD', path, 'The active implementation must be the provider of record.');
  }
  if (lifecycle === 'retired' && providerOfRecord === true) {
    addIssue(issues, 'RETIRED_PROVIDER_OF_RECORD', path, 'A retired implementation cannot be provider of record.');
  }
  validateProvider(capability.provider, `${path}.provider`, issues);
  validateSource(capability.source, `${path}.source`, issues);
  validateLicense(capability.license, `${path}.license`, issues);
  validateAdapters(capability.adapters, `${path}.adapters`, issues);
  requireStringArray(capability, 'brandTokenRoles', path, issues, { pattern: TOKEN_ROLE });
  validateConformance(capability.conformance, `${path}.conformance`, issues);
  validateUpstream(capability.upstream, `${path}.upstream`, issues);
  if (capability.replacement !== undefined) {
    validateReplacement(capability.replacement, `${path}.replacement`, issues);
  }
}

export function validateRegistryInvariants(
  capabilities: readonly unknown[],
  issues: RegistryValidationIssue[],
): void {
  const byCapability = new Map<string, JsonObject[]>();
  const implementationIds = new Map<string, string>();
  const activeExports = new Map<string, string>();
  const packagePins = new Map<string, string>();
  const artifactHashes = new Map<string, string>();

  for (const [index, value] of capabilities.entries()) {
    if (!isObject(value)) continue;
    const path = `$.capabilities[${index}]`;
    const capabilityId = typeof value.capabilityId === 'string' ? value.capabilityId : undefined;
    if (capabilityId) {
      const records = byCapability.get(capabilityId) ?? [];
      records.push(value);
      byCapability.set(capabilityId, records);
    }
    if (typeof value.implementationId === 'string') {
      const previous = implementationIds.get(value.implementationId);
      if (previous) {
        addIssue(issues, 'DUPLICATE_IMPLEMENTATION', `${path}.implementationId`, `Already declared at ${previous}.`);
      } else {
        implementationIds.set(value.implementationId, path);
      }
    }
    if (value.lifecycle === 'active' && typeof value.publicExport === 'string' && capabilityId) {
      const previousCapability = activeExports.get(value.publicExport);
      if (previousCapability && previousCapability !== capabilityId) {
        addIssue(
          issues,
          'DUPLICATE_PUBLIC_EXPORT',
          `${path}.publicExport`,
          `Public export is already owned by capability ${previousCapability}.`,
        );
      } else {
        activeExports.set(value.publicExport, capabilityId);
      }
    }
    validateRuntimePinInvariant(value, path, packagePins, issues);
    validateArtifactHashInvariant(value, path, artifactHashes, issues);
  }

  for (const [capabilityId, records] of byCapability) {
    const activeRecords = records.filter((record) => record.lifecycle === 'active');
    const providersOfRecord = records.filter((record) => record.providerOfRecord === true);
    if (activeRecords.length !== 1) {
      addIssue(
        issues,
        'ACTIVE_IMPLEMENTATION_COUNT',
        '$.capabilities',
        `Capability ${capabilityId} must have exactly one active implementation; found ${activeRecords.length}.`,
      );
    }
    if (providersOfRecord.length !== 1) {
      addIssue(
        issues,
        'PROVIDER_OF_RECORD_COUNT',
        '$.capabilities',
        `Capability ${capabilityId} must have exactly one provider of record; found ${providersOfRecord.length}.`,
      );
    }
  }
}

function validateRuntimePinInvariant(
  capability: JsonObject,
  path: string,
  packagePins: Map<string, string>,
  issues: RegistryValidationIssue[],
): void {
  if (capability.lifecycle !== 'active') return;
  if (!isObject(capability.source) || capability.source.ingestionMode !== 'runtime_dependency') return;
  const { packageName, packageVersion, packageIntegrity, dependencyMode } = capability.source;
  if (
    typeof packageName !== 'string' ||
    typeof packageVersion !== 'string' ||
    typeof packageIntegrity !== 'string' ||
    typeof dependencyMode !== 'string'
  ) return;
  const pin = `${packageVersion}|${packageIntegrity}|${dependencyMode}`;
  const previousPin = packagePins.get(packageName);
  if (previousPin && previousPin !== pin) {
    addIssue(
      issues,
      'PROVIDER_VERSION_SPLIT',
      `${path}.source`,
      `Package ${packageName} must have one exact version, integrity, and dependency mode.`,
    );
  } else {
    packagePins.set(packageName, pin);
  }
}

function validateArtifactHashInvariant(
  capability: JsonObject,
  path: string,
  artifactHashes: Map<string, string>,
  issues: RegistryValidationIssue[],
): void {
  if (!isObject(capability.license) || !Array.isArray(capability.license.files)) return;
  for (const file of capability.license.files) {
    if (!isObject(file) || typeof file.path !== 'string' || typeof file.sha256 !== 'string') continue;
    const previousHash = artifactHashes.get(file.path);
    if (previousHash && previousHash !== file.sha256) {
      addIssue(
        issues,
        'ARTIFACT_HASH_SPLIT',
        `${path}.license.files`,
        `Artifact ${file.path} is declared with conflicting hashes.`,
      );
    } else {
      artifactHashes.set(file.path, file.sha256);
    }
  }
}

import type { RegistryValidationIssue } from './model.js';
import {
  FULL_GIT_SHA,
  IMPLEMENTATION_ID,
  PACKAGE_NAME,
  SHA256,
  SHA512_INTEGRITY,
  SLUG,
  addIssue,
  isExactPackageVersion,
  isObject,
  isSafeRepositoryPath,
  optionalString,
  rejectUnknownKeys,
  requireEnum,
  requireObject,
  requireString,
  requireStringArray,
  type JsonObject,
  validateDateTime,
  validateHttpsUrl,
} from './validation-support.js';

export function validateProvider(value: unknown, path: string, issues: RegistryValidationIssue[]): void {
  const provider = requireObject(value, path, issues);
  if (!provider) return;
  rejectUnknownKeys(provider, ['id', 'name', 'repository'], path, issues);
  requireString(provider, 'id', path, issues, { pattern: SLUG });
  requireString(provider, 'name', path, issues);
  validateHttpsUrl(requireString(provider, 'repository', path, issues), `${path}.repository`, issues);
}

function validateRuntimeSource(source: JsonObject, path: string, issues: RegistryValidationIssue[]): void {
  rejectUnknownKeys(
    source,
    ['ingestionMode', 'packageName', 'packageVersion', 'packageIntegrity', 'dependencyMode', 'packagePaths'],
    path,
    issues,
  );
  requireString(source, 'packageName', path, issues, { pattern: PACKAGE_NAME });
  const version = requireString(source, 'packageVersion', path, issues);
  if (version && !isExactPackageVersion(version)) {
    addIssue(
      issues,
      'UNPINNED_VERSION',
      `${path}.packageVersion`,
      'Provider package versions must be exact; ranges and tags are forbidden.',
    );
  }
  requireString(source, 'packageIntegrity', path, issues, { pattern: SHA512_INTEGRITY });
  requireEnum(source, 'dependencyMode', ['bundled', 'runtime_dependency', 'peer_dependency'], path, issues);
  requireStringArray(source, 'packagePaths', path, issues, { minItems: 1, safePaths: true });
}

function validateSnapshotFile(value: unknown, path: string, issues: RegistryValidationIssue[]): void {
  const file = requireObject(value, path, issues);
  if (!file) return;
  rejectUnknownKeys(file, ['upstreamPath', 'localPath', 'upstreamSha256', 'localSha256'], path, issues);
  for (const key of ['upstreamPath', 'localPath'] as const) {
    const valueToCheck = requireString(file, key, path, issues);
    if (valueToCheck && !isSafeRepositoryPath(valueToCheck)) {
      addIssue(issues, 'UNSAFE_PATH', `${path}.${key}`, 'Expected a normalized repository-relative path.');
    }
  }
  requireString(file, 'upstreamSha256', path, issues, { pattern: SHA256 });
  requireString(file, 'localSha256', path, issues, { pattern: SHA256 });
}

function validateTransform(value: unknown, path: string, issues: RegistryValidationIssue[]): void {
  const transform = requireObject(value, path, issues);
  if (!transform) return;
  rejectUnknownKeys(transform, ['id', 'version', 'scriptPath', 'scriptSha256'], path, issues);
  requireString(transform, 'id', path, issues, { pattern: SLUG });
  const version = requireString(transform, 'version', path, issues);
  if (version && !isExactPackageVersion(version)) {
    addIssue(issues, 'UNPINNED_VERSION', `${path}.version`, 'Transform versions must be exact.');
  }
  const scriptPath = requireString(transform, 'scriptPath', path, issues);
  if (scriptPath && !isSafeRepositoryPath(scriptPath)) {
    addIssue(issues, 'UNSAFE_PATH', `${path}.scriptPath`, 'Expected a normalized repository-relative path.');
  }
  requireString(transform, 'scriptSha256', path, issues, { pattern: SHA256 });
}

function validatePatch(value: unknown, path: string, issues: RegistryValidationIssue[]): void {
  const patch = requireObject(value, path, issues);
  if (!patch) return;
  rejectUnknownKeys(patch, ['path', 'sha256', 'reason', 'upstreamIssue'], path, issues);
  const patchPath = requireString(patch, 'path', path, issues);
  if (patchPath && !isSafeRepositoryPath(patchPath)) {
    addIssue(issues, 'UNSAFE_PATH', `${path}.path`, 'Expected a normalized repository-relative path.');
  }
  requireString(patch, 'sha256', path, issues, { pattern: SHA256 });
  requireString(patch, 'reason', path, issues, { minLength: 20 });
  validateHttpsUrl(optionalString(patch, 'upstreamIssue', path, issues), `${path}.upstreamIssue`, issues);
}

function validateSnapshotSource(source: JsonObject, path: string, issues: RegistryValidationIssue[]): void {
  rejectUnknownKeys(
    source,
    ['ingestionMode', 'commitSha', 'selectedSourcePaths', 'closure', 'transforms', 'patches'],
    path,
    issues,
  );
  requireString(source, 'commitSha', path, issues, { pattern: FULL_GIT_SHA });
  const selectedPaths = requireStringArray(source, 'selectedSourcePaths', path, issues, {
    minItems: 1,
    safePaths: true,
  });
  const closure = source.closure;
  const closurePaths = new Set<string>();
  if (!Array.isArray(closure) || closure.length === 0) {
    addIssue(issues, 'SNAPSHOT_CLOSURE_REQUIRED', `${path}.closure`, 'Source snapshots require a complete closure.');
  } else {
    closure.forEach((file, index) => {
      validateSnapshotFile(file, `${path}.closure[${index}]`, issues);
      if (isObject(file) && typeof file.upstreamPath === 'string') closurePaths.add(file.upstreamPath);
    });
  }
  for (const selectedPath of selectedPaths ?? []) {
    if (!closurePaths.has(selectedPath)) {
      addIssue(
        issues,
        'SNAPSHOT_CLOSURE_MISSING',
        `${path}.selectedSourcePaths`,
        `Selected source path ${selectedPath} is absent from the declared closure.`,
      );
    }
  }
  if (!Array.isArray(source.transforms)) {
    addIssue(issues, 'TYPE_ARRAY', `${path}.transforms`, 'Expected an array.');
  } else {
    source.transforms.forEach((transform, index) => {
      validateTransform(transform, `${path}.transforms[${index}]`, issues);
    });
  }
  if (!Array.isArray(source.patches)) {
    addIssue(issues, 'TYPE_ARRAY', `${path}.patches`, 'Expected an array.');
  } else {
    source.patches.forEach((patch, index) => {
      validatePatch(patch, `${path}.patches[${index}]`, issues);
    });
  }
}

function validateNativeSource(source: JsonObject, path: string, issues: RegistryValidationIssue[]): void {
  rejectUnknownKeys(source, ['ingestionMode', 'rationale', 'maintenanceOwner', 'reviewedAt'], path, issues);
  requireString(source, 'rationale', path, issues, { minLength: 40 });
  requireString(source, 'maintenanceOwner', path, issues);
  validateDateTime(requireString(source, 'reviewedAt', path, issues), `${path}.reviewedAt`, issues);
}

export function validateSource(value: unknown, path: string, issues: RegistryValidationIssue[]): void {
  const source = requireObject(value, path, issues);
  if (!source) return;
  const mode = requireEnum(
    source,
    'ingestionMode',
    ['runtime_dependency', 'source_snapshot', 'native_lemn'],
    path,
    issues,
  );
  if (mode === 'runtime_dependency') validateRuntimeSource(source, path, issues);
  if (mode === 'source_snapshot') validateSnapshotSource(source, path, issues);
  if (mode === 'native_lemn') validateNativeSource(source, path, issues);
}

export function validateAdapters(value: unknown, path: string, issues: RegistryValidationIssue[]): void {
  const adapters = requireObject(value, path, issues);
  if (!adapters) return;
  rejectUnknownKeys(adapters, ['publicApi', 'theme'], path, issues);
  for (const key of ['publicApi', 'theme'] as const) {
    const valueToCheck = key === 'theme'
      ? optionalString(adapters, key, path, issues)
      : requireString(adapters, key, path, issues);
    if (valueToCheck && !isSafeRepositoryPath(valueToCheck)) {
      addIssue(issues, 'UNSAFE_PATH', `${path}.${key}`, 'Expected a normalized repository-relative path.');
    }
  }
}

export function validateConformance(
  value: unknown,
  path: string,
  issues: RegistryValidationIssue[],
): void {
  const conformance = requireObject(value, path, issues);
  if (!conformance) return;
  const keys = ['behavior', 'accessibility', 'interaction', 'visual', 'ssr', 'bundle'] as const;
  rejectUnknownKeys(conformance, keys, path, issues);
  for (const key of keys) {
    requireStringArray(conformance, key, path, issues, {
      minItems: key === 'behavior' ? 1 : 0,
      safePaths: true,
    });
  }
}

export function validateUpstream(value: unknown, path: string, issues: RegistryValidationIssue[]): void {
  const upstream = requireObject(value, path, issues);
  if (!upstream) return;
  rejectUnknownKeys(upstream, ['lastSuccessfulSync', 'updateStatus', 'upstreamReference'], path, issues);
  validateDateTime(
    requireString(upstream, 'lastSuccessfulSync', path, issues),
    `${path}.lastSuccessfulSync`,
    issues,
  );
  requireEnum(upstream, 'updateStatus', ['current', 'update_available', 'blocked', 'unknown'], path, issues);
  validateHttpsUrl(
    requireString(upstream, 'upstreamReference', path, issues),
    `${path}.upstreamReference`,
    issues,
  );
}

export function validateReplacement(
  value: unknown,
  path: string,
  issues: RegistryValidationIssue[],
): void {
  const replacement = requireObject(value, path, issues);
  if (!replacement) return;
  const keys = [
    'supersedesImplementationId',
    'adrPath',
    'apiBehaviorVisualDeltaPath',
    'migrationNotesPath',
    'semverImpact',
  ] as const;
  rejectUnknownKeys(replacement, keys, path, issues);
  requireString(replacement, 'supersedesImplementationId', path, issues, { pattern: IMPLEMENTATION_ID });
  for (const key of ['adrPath', 'apiBehaviorVisualDeltaPath', 'migrationNotesPath'] as const) {
    const valueToCheck = requireString(replacement, key, path, issues);
    if (valueToCheck && !isSafeRepositoryPath(valueToCheck)) {
      addIssue(issues, 'UNSAFE_PATH', `${path}.${key}`, 'Expected a normalized repository-relative path.');
    }
  }
  requireEnum(replacement, 'semverImpact', ['patch', 'minor', 'major'], path, issues);
}

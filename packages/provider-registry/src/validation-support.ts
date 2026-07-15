import type { RegistryValidationIssue } from './model.js';

export type JsonObject = Record<string, unknown>;

export const SHA256 = /^[a-f0-9]{64}$/;
export const FULL_GIT_SHA = /^[a-f0-9]{40}$/;
export const SHA512_INTEGRITY = /^sha512-[A-Za-z0-9+/]+={0,2}$/;
export const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const CAPABILITY_ID = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)+$/;
export const IMPLEMENTATION_ID = /^[a-z0-9][a-z0-9._@/+:-]*$/;
export const PACKAGE_NAME =
  /^(?:@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*|[a-z0-9][a-z0-9._-]*)$/;
export const TOKEN_ROLE = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+$/;

const EXACT_SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export function isExactPackageVersion(value: string): boolean {
  return EXACT_SEMVER.test(value);
}

export function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function addIssue(
  issues: RegistryValidationIssue[],
  code: string,
  path: string,
  message: string,
): void {
  issues.push({ code, path, message });
}

export function requireObject(
  value: unknown,
  path: string,
  issues: RegistryValidationIssue[],
): JsonObject | undefined {
  if (isObject(value)) return value;
  addIssue(issues, 'TYPE_OBJECT', path, 'Expected an object.');
  return undefined;
}

export function rejectUnknownKeys(
  object: JsonObject,
  allowed: readonly string[],
  path: string,
  issues: RegistryValidationIssue[],
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(object)) {
    if (!allowedSet.has(key)) {
      addIssue(issues, 'UNKNOWN_FIELD', `${path}.${key}`, 'Unknown fields are not allowed.');
    }
  }
}

export function requireString(
  object: JsonObject,
  key: string,
  path: string,
  issues: RegistryValidationIssue[],
  options: { readonly minLength?: number; readonly pattern?: RegExp } = {},
): string | undefined {
  const value = object[key];
  if (typeof value !== 'string') {
    addIssue(issues, 'TYPE_STRING', `${path}.${key}`, 'Expected a string.');
    return undefined;
  }
  if (value.length < (options.minLength ?? 1)) {
    addIssue(issues, 'STRING_LENGTH', `${path}.${key}`, 'String is shorter than allowed.');
  }
  if (options.pattern && !options.pattern.test(value)) {
    addIssue(issues, 'STRING_FORMAT', `${path}.${key}`, 'String has an invalid format.');
  }
  return value;
}

export function optionalString(
  object: JsonObject,
  key: string,
  path: string,
  issues: RegistryValidationIssue[],
): string | undefined {
  const value = object[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length === 0) {
    addIssue(issues, 'TYPE_STRING', `${path}.${key}`, 'Expected a non-empty string.');
    return undefined;
  }
  return value;
}

export function requireBoolean(
  object: JsonObject,
  key: string,
  path: string,
  issues: RegistryValidationIssue[],
): boolean | undefined {
  const value = object[key];
  if (typeof value !== 'boolean') {
    addIssue(issues, 'TYPE_BOOLEAN', `${path}.${key}`, 'Expected a boolean.');
    return undefined;
  }
  return value;
}

export function requireLiteral<T extends string | number>(
  object: JsonObject,
  key: string,
  expected: T,
  path: string,
  issues: RegistryValidationIssue[],
): T | undefined {
  if (object[key] === expected) return expected;
  addIssue(issues, 'INVALID_LITERAL', `${path}.${key}`, `Expected ${JSON.stringify(expected)}.`);
  return undefined;
}

export function requireEnum<T extends string>(
  object: JsonObject,
  key: string,
  allowed: readonly T[],
  path: string,
  issues: RegistryValidationIssue[],
): T | undefined {
  const value = requireString(object, key, path, issues);
  if (value === undefined) return undefined;
  if ((allowed as readonly string[]).includes(value)) return value as T;
  addIssue(issues, 'INVALID_ENUM', `${path}.${key}`, `Expected one of: ${allowed.join(', ')}.`);
  return undefined;
}

export function requireStringArray(
  object: JsonObject,
  key: string,
  path: string,
  issues: RegistryValidationIssue[],
  options: {
    readonly minItems?: number;
    readonly pattern?: RegExp;
    readonly safePaths?: boolean;
  } = {},
): readonly string[] | undefined {
  const value = object[key];
  if (!Array.isArray(value)) {
    addIssue(issues, 'TYPE_ARRAY', `${path}.${key}`, 'Expected an array.');
    return undefined;
  }
  if (value.length < (options.minItems ?? 0)) {
    addIssue(issues, 'ARRAY_LENGTH', `${path}.${key}`, 'Array has fewer items than allowed.');
  }
  const strings: string[] = [];
  for (const [index, item] of value.entries()) {
    const itemPath = `${path}.${key}[${index}]`;
    if (typeof item !== 'string' || item.length === 0) {
      addIssue(issues, 'TYPE_STRING', itemPath, 'Expected a non-empty string.');
      continue;
    }
    if (options.pattern && !options.pattern.test(item)) {
      addIssue(issues, 'STRING_FORMAT', itemPath, 'String has an invalid format.');
    }
    if (options.safePaths && !isSafeRepositoryPath(item)) {
      addIssue(issues, 'UNSAFE_PATH', itemPath, 'Expected a normalized repository-relative path.');
    }
    strings.push(item);
  }
  if (new Set(strings).size !== strings.length) {
    addIssue(issues, 'DUPLICATE_VALUE', `${path}.${key}`, 'Array values must be unique.');
  }
  return strings;
}

export function isSafeRepositoryPath(value: string): boolean {
  if (value.startsWith('/') || value.startsWith('./') || value.includes('\\')) return false;
  const segments = value.split('/');
  return segments.length > 0 && segments.every((segment) => segment !== '' && segment !== '..');
}

export function validateHttpsUrl(
  value: string | undefined,
  path: string,
  issues: RegistryValidationIssue[],
): void {
  if (!value) return;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') throw new Error('protocol');
  } catch {
    addIssue(issues, 'HTTPS_URL', path, 'Expected an absolute HTTPS URL.');
  }
}

export function validateDateTime(
  value: string | undefined,
  path: string,
  issues: RegistryValidationIssue[],
): void {
  if (!value) return;
  if (!ISO_DATE_TIME.test(value) || Number.isNaN(Date.parse(value))) {
    addIssue(issues, 'DATE_TIME', path, 'Expected an RFC 3339 UTC date-time.');
  }
}

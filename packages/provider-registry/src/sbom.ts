import type {
  ProviderRegistryManifest,
  RegistryValidationIssue,
  RegistryValidationResult,
} from './model.js';
import { isExactPackageVersion } from './validation.js';

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function issue(code: string, path: string, message: string): RegistryValidationIssue {
  return { code, path, message };
}

export function validateRegistrySbom(
  manifest: ProviderRegistryManifest,
  value: unknown,
): RegistryValidationResult {
  const issues: RegistryValidationIssue[] = [];
  if (!isObject(value)) {
    return {
      success: false,
      issues: [issue('SBOM_INVALID', '$', 'SPDX document must be an object.')],
    };
  }
  if (value.spdxVersion !== manifest.sbom.format) {
    issues.push(issue('SBOM_VERSION', '$.spdxVersion', `Expected ${manifest.sbom.format}.`));
  }
  if (!Array.isArray(value.packages)) {
    issues.push(issue('SBOM_PACKAGES', '$.packages', 'SPDX document must contain packages.'));
    return { success: false, issues };
  }

  const packagesByName = new Map<string, JsonObject[]>();
  value.packages.forEach((entry, index) => {
    if (!isObject(entry)) {
      issues.push(issue('SBOM_PACKAGE_INVALID', `$.packages[${index}]`, 'Package must be an object.'));
      return;
    }
    if (typeof entry.name !== 'string' || entry.name.length === 0) {
      issues.push(issue('SBOM_PACKAGE_NAME', `$.packages[${index}].name`, 'Package name is required.'));
      return;
    }
    if (typeof entry.versionInfo !== 'string' || !isExactPackageVersion(entry.versionInfo)) {
      issues.push(
        issue('SBOM_PACKAGE_VERSION', `$.packages[${index}].versionInfo`, 'Package version must be exact.'),
      );
    }
    const records = packagesByName.get(entry.name) ?? [];
    records.push(entry);
    packagesByName.set(entry.name, records);
  });

  const expected = new Map<string, { readonly version: string; readonly license: string }>();
  for (const capability of manifest.capabilities) {
    if (capability.lifecycle !== 'active' || capability.source.ingestionMode !== 'runtime_dependency') continue;
    expected.set(capability.source.packageName, {
      version: capability.source.packageVersion,
      license: capability.license.spdx,
    });
  }

  for (const [name, expectedPackage] of expected) {
    const matches = packagesByName.get(name) ?? [];
    if (matches.length !== 1) {
      issues.push(
        issue(
          'SBOM_PROVIDER_COUNT',
          '$.packages',
          `Expected exactly one SPDX package for ${name}; found ${matches.length}.`,
        ),
      );
      continue;
    }
    const packageEntry = matches[0];
    if (!packageEntry) continue;
    if (packageEntry.versionInfo !== expectedPackage.version) {
      issues.push(
        issue(
          'SBOM_PROVIDER_VERSION',
          '$.packages',
          `SPDX package ${name} does not match registry version ${expectedPackage.version}.`,
        ),
      );
    }
    if (packageEntry.licenseDeclared !== expectedPackage.license) {
      issues.push(
        issue(
          'SBOM_PROVIDER_LICENSE',
          '$.packages',
          `SPDX package ${name} does not match registry license ${expectedPackage.license}.`,
        ),
      );
    }
  }

  return { success: issues.length === 0, issues };
}

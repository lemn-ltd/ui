import {
  AUTOMATIC_LICENSE_ALLOWLIST,
  DENIED_LICENSES,
  MANUAL_REVIEW_LICENSES,
  type RegistryValidationIssue,
} from './model.js';
import {
  SHA256,
  addIssue,
  isObject,
  isSafeRepositoryPath,
  rejectUnknownKeys,
  requireEnum,
  requireLiteral,
  requireObject,
  requireString,
  requireStringArray,
  validateDateTime,
} from './validation-support.js';

function expectExactPolicyList(
  object: Record<string, unknown>,
  key: string,
  expected: readonly string[],
  path: string,
  issues: RegistryValidationIssue[],
): void {
  const actual = requireStringArray(object, key, path, issues);
  if (!actual) return;
  if (JSON.stringify([...actual].sort()) !== JSON.stringify([...expected].sort())) {
    addIssue(
      issues,
      'LICENSE_POLICY_DRIFT',
      `${path}.${key}`,
      'Manifest license policy must match the reviewed package policy.',
    );
  }
}

export function validateLicensePolicy(
  value: unknown,
  path: string,
  issues: RegistryValidationIssue[],
): void {
  const policy = requireObject(value, path, issues);
  if (!policy) return;
  rejectUnknownKeys(policy, ['automaticAllowlist', 'manualReview', 'denied'], path, issues);
  expectExactPolicyList(policy, 'automaticAllowlist', AUTOMATIC_LICENSE_ALLOWLIST, path, issues);
  expectExactPolicyList(policy, 'manualReview', MANUAL_REVIEW_LICENSES, path, issues);
  expectExactPolicyList(policy, 'denied', DENIED_LICENSES, path, issues);
}

export function validateSbomMetadata(
  value: unknown,
  path: string,
  issues: RegistryValidationIssue[],
): void {
  const sbom = requireObject(value, path, issues);
  if (!sbom) return;
  rejectUnknownKeys(sbom, ['format', 'path', 'sha256'], path, issues);
  requireLiteral(sbom, 'format', 'SPDX-2.3', path, issues);
  const sbomPath = requireString(sbom, 'path', path, issues);
  if (sbomPath && (!isSafeRepositoryPath(sbomPath) || !sbomPath.startsWith('third-party/'))) {
    addIssue(issues, 'SBOM_PATH', `${path}.path`, 'SBOM must be a repository-relative third-party artifact.');
  }
  requireString(sbom, 'sha256', path, issues, { pattern: SHA256 });
}

function validateLicenseArtifact(
  value: unknown,
  path: string,
  issues: RegistryValidationIssue[],
): void {
  const artifact = requireObject(value, path, issues);
  if (!artifact) return;
  rejectUnknownKeys(artifact, ['kind', 'path', 'sha256'], path, issues);
  requireEnum(artifact, 'kind', ['LICENSE', 'NOTICE'], path, issues);
  const artifactPath = requireString(artifact, 'path', path, issues);
  if (artifactPath) {
    if (!isSafeRepositoryPath(artifactPath)) {
      addIssue(issues, 'UNSAFE_PATH', `${path}.path`, 'Expected a normalized repository-relative path.');
    }
    if (!artifactPath.startsWith('third-party/licenses/')) {
      addIssue(
        issues,
        'LICENSE_PATH',
        `${path}.path`,
        'Captured licenses must be stored under third-party/licenses/.',
      );
    }
  }
  requireString(artifact, 'sha256', path, issues, { pattern: SHA256 });
}

function validateLegalReview(value: unknown, path: string, issues: RegistryValidationIssue[]): void {
  const review = requireObject(value, path, issues);
  if (!review) return;
  rejectUnknownKeys(review, ['decision', 'reviewId', 'reviewedAt', 'reviewerRole'], path, issues);
  requireLiteral(review, 'decision', 'approved', path, issues);
  requireString(review, 'reviewId', path, issues);
  validateDateTime(requireString(review, 'reviewedAt', path, issues), `${path}.reviewedAt`, issues);
  requireString(review, 'reviewerRole', path, issues);
}

export function validateLicense(
  value: unknown,
  path: string,
  issues: RegistryValidationIssue[],
): void {
  const license = requireObject(value, path, issues);
  if (!license) return;
  rejectUnknownKeys(
    license,
    ['spdx', 'reviewClass', 'copyright', 'requirements', 'files', 'legalReview'],
    path,
    issues,
  );
  const spdx = requireString(license, 'spdx', path, issues);
  const reviewClass = requireEnum(license, 'reviewClass', ['automatic', 'manual', 'denied'], path, issues);
  requireString(license, 'copyright', path, issues);
  requireStringArray(license, 'requirements', path, issues, { minItems: 1 });

  const files = license.files;
  if (!Array.isArray(files) || files.length === 0) {
    addIssue(issues, 'LICENSE_FILES_REQUIRED', `${path}.files`, 'At least one captured license file is required.');
  } else {
    files.forEach((file, index) => {
      validateLicenseArtifact(file, `${path}.files[${index}]`, issues);
    });
    if (!files.some((file) => isObject(file) && file.kind === 'LICENSE')) {
      addIssue(issues, 'LICENSE_FILE_REQUIRED', `${path}.files`, 'A LICENSE artifact is required.');
    }
  }

  if (!spdx || !reviewClass) return;
  const isAutomatic = (AUTOMATIC_LICENSE_ALLOWLIST as readonly string[]).includes(spdx);
  const isManual = (MANUAL_REVIEW_LICENSES as readonly string[]).includes(spdx);
  const isDenied = (DENIED_LICENSES as readonly string[]).some((denied) => spdx.includes(denied));
  if (isDenied || reviewClass === 'denied') {
    addIssue(issues, 'LICENSE_DENIED', path, `License ${spdx} is denied by policy.`);
    return;
  }
  if (isAutomatic && reviewClass !== 'automatic') {
    addIssue(issues, 'LICENSE_CLASS', `${path}.reviewClass`, 'Allowlisted licenses use automatic review.');
  } else if (isManual && reviewClass !== 'manual') {
    addIssue(issues, 'LICENSE_CLASS', `${path}.reviewClass`, 'This license requires manual review.');
  } else if (!isAutomatic && !isManual && reviewClass !== 'manual') {
    addIssue(issues, 'LICENSE_UNKNOWN', `${path}.spdx`, 'Unknown license obligations block the registry.');
  }

  if (reviewClass === 'manual') {
    if (license.legalReview === undefined) {
      addIssue(issues, 'LEGAL_REVIEW_REQUIRED', `${path}.legalReview`, 'Manual licenses require approval.');
    } else {
      validateLegalReview(license.legalReview, `${path}.legalReview`, issues);
    }
  } else if (license.legalReview !== undefined) {
    addIssue(issues, 'UNEXPECTED_LEGAL_REVIEW', `${path}.legalReview`, 'Legal review is only valid for manual licenses.');
  }
}

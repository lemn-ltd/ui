export const PROVIDER_REGISTRY_SCHEMA_VERSION = 1 as const;

export const PROVIDER_REGISTRY_SCHEMA_URI =
  'https://schemas.ui.le-mn.com/provider-registry/v1.json' as const;

export const AUTOMATIC_LICENSE_ALLOWLIST = [
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
] as const;

export const MANUAL_REVIEW_LICENSES = ['MPL-2.0', 'LGPL-2.1-only', 'LGPL-3.0-only'] as const;

export const DENIED_LICENSES = [
  'GPL-2.0-only',
  'GPL-3.0-only',
  'AGPL-3.0-only',
  'SSPL-1.0',
  'BUSL-1.1',
  'Commons-Clause',
  'LicenseRef-Proprietary',
  'LicenseRef-Source-Available',
] as const;

export type CapabilityMaturity = 'experimental' | 'beta' | 'stable' | 'deprecated';
export type ImplementationLifecycle = 'active' | 'retired';
export type DependencyMode = 'bundled' | 'runtime_dependency' | 'peer_dependency';
export type UpstreamUpdateStatus = 'current' | 'update_available' | 'blocked' | 'unknown';
export type LicenseReviewClass = 'automatic' | 'manual' | 'denied';
export type LicenseArtifactKind = 'LICENSE' | 'NOTICE';
export type SemverImpact = 'patch' | 'minor' | 'major';

export interface GitManifestAuthority {
  readonly kind: 'git_manifest';
  readonly repository: string;
  readonly path: string;
}

export interface LicensePolicy {
  readonly automaticAllowlist: readonly string[];
  readonly manualReview: readonly string[];
  readonly denied: readonly string[];
}

export interface SbomArtifact {
  readonly format: 'SPDX-2.3';
  readonly path: string;
  readonly sha256: string;
}

export interface LicenseArtifact {
  readonly kind: LicenseArtifactKind;
  readonly path: string;
  readonly sha256: string;
}

export interface LegalReview {
  readonly decision: 'approved';
  readonly reviewId: string;
  readonly reviewedAt: string;
  readonly reviewerRole: string;
}

export interface LicenseProvenance {
  readonly spdx: string;
  readonly reviewClass: LicenseReviewClass;
  readonly copyright: string;
  readonly requirements: readonly string[];
  readonly files: readonly LicenseArtifact[];
  readonly legalReview?: LegalReview;
}

export interface RuntimeDependencySource {
  readonly ingestionMode: 'runtime_dependency';
  readonly packageName: string;
  readonly packageVersion: string;
  readonly packageIntegrity: string;
  readonly dependencyMode: DependencyMode;
  readonly packagePaths: readonly string[];
}

export interface SourceSnapshotFile {
  readonly upstreamPath: string;
  readonly localPath: string;
  readonly upstreamSha256: string;
  readonly localSha256: string;
}

export interface DeterministicTransform {
  readonly id: string;
  readonly version: string;
  readonly scriptPath: string;
  readonly scriptSha256: string;
}

export interface ExplicitPatch {
  readonly path: string;
  readonly sha256: string;
  readonly reason: string;
  readonly upstreamIssue?: string;
}

export interface SourceSnapshotSource {
  readonly ingestionMode: 'source_snapshot';
  readonly commitSha: string;
  readonly selectedSourcePaths: readonly string[];
  readonly closure: readonly SourceSnapshotFile[];
  readonly transforms: readonly DeterministicTransform[];
  readonly patches: readonly ExplicitPatch[];
}

export interface NativeLemnSource {
  readonly ingestionMode: 'native_lemn';
  readonly rationale: string;
  readonly maintenanceOwner: string;
  readonly reviewedAt: string;
}

export type ProviderSource = RuntimeDependencySource | SourceSnapshotSource | NativeLemnSource;

export interface ProviderIdentity {
  readonly id: string;
  readonly name: string;
  readonly repository: string;
}

export interface ProviderAdapters {
  readonly publicApi: string;
  readonly theme?: string;
}

export interface ConformanceEvidence {
  readonly behavior: readonly string[];
  readonly accessibility: readonly string[];
  readonly interaction: readonly string[];
  readonly visual: readonly string[];
  readonly ssr: readonly string[];
  readonly bundle: readonly string[];
}

export interface UpstreamSyncState {
  readonly lastSuccessfulSync: string;
  readonly updateStatus: UpstreamUpdateStatus;
  readonly upstreamReference: string;
}

export interface ProviderReplacement {
  readonly supersedesImplementationId: string;
  readonly adrPath: string;
  readonly apiBehaviorVisualDeltaPath: string;
  readonly migrationNotesPath: string;
  readonly semverImpact: SemverImpact;
}

export interface CapabilityImplementation {
  readonly capabilityId: string;
  readonly implementationId: string;
  readonly publicExport: string;
  readonly category: string;
  readonly maturity: CapabilityMaturity;
  readonly lifecycle: ImplementationLifecycle;
  readonly providerOfRecord: boolean;
  readonly provider: ProviderIdentity;
  readonly source: ProviderSource;
  readonly license: LicenseProvenance;
  readonly adapters: ProviderAdapters;
  readonly brandTokenRoles: readonly string[];
  readonly conformance: ConformanceEvidence;
  readonly upstream: UpstreamSyncState;
  readonly replacement?: ProviderReplacement;
}

export interface ProviderRegistryManifest {
  readonly $schema: typeof PROVIDER_REGISTRY_SCHEMA_URI;
  readonly schemaVersion: typeof PROVIDER_REGISTRY_SCHEMA_VERSION;
  readonly registryId: string;
  readonly revision: string;
  readonly sourceOfTruth: GitManifestAuthority;
  readonly licensePolicy: LicensePolicy;
  readonly sbom: SbomArtifact;
  readonly capabilities: readonly CapabilityImplementation[];
}

export interface RegistryValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface RegistryValidationResult {
  readonly success: boolean;
  readonly issues: readonly RegistryValidationIssue[];
}

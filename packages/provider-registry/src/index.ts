export {
  AUTOMATIC_LICENSE_ALLOWLIST,
  DENIED_LICENSES,
  MANUAL_REVIEW_LICENSES,
  PROVIDER_REGISTRY_SCHEMA_URI,
  PROVIDER_REGISTRY_SCHEMA_VERSION,
} from './model.js';

export type {
  CapabilityImplementation,
  CapabilityMaturity,
  ConformanceEvidence,
  DependencyMode,
  DeterministicTransform,
  ExplicitPatch,
  GitManifestAuthority,
  ImplementationLifecycle,
  LegalReview,
  LicenseArtifact,
  LicenseArtifactKind,
  LicensePolicy,
  LicenseProvenance,
  LicenseReviewClass,
  NativeLemnSource,
  ProviderAdapters,
  ProviderIdentity,
  ProviderRegistryManifest,
  ProviderReplacement,
  ProviderSource,
  RegistryValidationIssue,
  RegistryValidationResult,
  RuntimeDependencySource,
  SbomArtifact,
  SemverImpact,
  SourceSnapshotFile,
  SourceSnapshotSource,
  UpstreamSyncState,
  UpstreamUpdateStatus,
} from './model.js';

export {
  assertValidProviderRegistry,
  isExactPackageVersion,
  validateProviderRegistry,
} from './validation.js';

export {
  buildProviderRegistryReadModel,
  getProviderOfRecord,
  type ProviderRegistryCapabilityReadModel,
  type ProviderRegistryReadModel,
} from './read-model.js';

export {
  collectRegistryArtifactReferences,
  verifyRegistryArtifacts,
  type RegistryArtifactReader,
} from './artifacts.js';

export { validateRegistrySbom } from './sbom.js';

export {
  verifyRuntimeProviderPins,
  type RuntimeProviderDependencyEvidence,
} from './runtime-pins.js';

export {
  CAPABILITY_MIGRATION_MATRIX_SCHEMA_URI,
  assertValidCapabilityMigrationMatrix,
  validateCapabilityMigrationMatrix,
  type CapabilityDisposition,
  type CapabilityMigrationMatrix,
  type CapabilityMigrationMatrixRecord,
  type MatrixProviderReference,
} from './migration-matrix.js';

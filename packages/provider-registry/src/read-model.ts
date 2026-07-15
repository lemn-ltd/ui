import type { CapabilityImplementation, ProviderRegistryManifest } from './model.js';
import { assertValidProviderRegistry } from './validation.js';

export interface ProviderRegistryCapabilityReadModel {
  readonly capabilityId: string;
  readonly publicExport: string;
  readonly category: string;
  readonly maturity: CapabilityImplementation['maturity'];
  readonly provider: CapabilityImplementation['provider'];
  readonly ingestionMode: CapabilityImplementation['source']['ingestionMode'];
  readonly exactUpstreamReference: string;
  readonly dependencyMode?: string;
  readonly license: Pick<CapabilityImplementation['license'], 'spdx' | 'reviewClass' | 'files'>;
  readonly adapters: CapabilityImplementation['adapters'];
  readonly brandTokenRoles: readonly string[];
  readonly conformanceCoverage: Readonly<Record<keyof CapabilityImplementation['conformance'], number>>;
  readonly upstream: CapabilityImplementation['upstream'];
}

export interface ProviderRegistryReadModel {
  readonly schemaVersion: ProviderRegistryManifest['schemaVersion'];
  readonly registryId: string;
  readonly revision: string;
  readonly authority: ProviderRegistryManifest['sourceOfTruth'];
  readonly sbom: ProviderRegistryManifest['sbom'];
  readonly capabilities: readonly ProviderRegistryCapabilityReadModel[];
}

function exactReference(capability: CapabilityImplementation): string {
  switch (capability.source.ingestionMode) {
    case 'runtime_dependency':
      return `${capability.source.packageName}@${capability.source.packageVersion}`;
    case 'source_snapshot':
      return `${capability.provider.repository}#${capability.source.commitSha}`;
    case 'native_lemn':
      return `native:${capability.source.reviewedAt}`;
  }
}

function coverage(
  conformance: CapabilityImplementation['conformance'],
): ProviderRegistryCapabilityReadModel['conformanceCoverage'] {
  return {
    behavior: conformance.behavior.length,
    accessibility: conformance.accessibility.length,
    interaction: conformance.interaction.length,
    visual: conformance.visual.length,
    ssr: conformance.ssr.length,
    bundle: conformance.bundle.length,
  };
}

export function getProviderOfRecord(
  manifest: ProviderRegistryManifest,
  capabilityId: string,
): CapabilityImplementation {
  const records = manifest.capabilities.filter(
    (capability) => capability.capabilityId === capabilityId && capability.providerOfRecord,
  );
  if (records.length !== 1) {
    throw new Error(
      `Capability ${capabilityId} must resolve to exactly one provider of record; found ${records.length}.`,
    );
  }
  const record = records[0];
  if (!record) throw new Error(`Capability ${capabilityId} has no provider of record.`);
  return record;
}

export function buildProviderRegistryReadModel(value: unknown): ProviderRegistryReadModel {
  assertValidProviderRegistry(value);
  const capabilities = value.capabilities
    .filter((capability) => capability.lifecycle === 'active' && capability.providerOfRecord)
    .map((capability): ProviderRegistryCapabilityReadModel => ({
      capabilityId: capability.capabilityId,
      publicExport: capability.publicExport,
      category: capability.category,
      maturity: capability.maturity,
      provider: capability.provider,
      ingestionMode: capability.source.ingestionMode,
      exactUpstreamReference: exactReference(capability),
      ...(capability.source.ingestionMode === 'runtime_dependency'
        ? { dependencyMode: capability.source.dependencyMode }
        : {}),
      license: {
        spdx: capability.license.spdx,
        reviewClass: capability.license.reviewClass,
        files: capability.license.files,
      },
      adapters: capability.adapters,
      brandTokenRoles: capability.brandTokenRoles,
      conformanceCoverage: coverage(capability.conformance),
      upstream: capability.upstream,
    }))
    .sort((left, right) => left.capabilityId.localeCompare(right.capabilityId));

  return {
    schemaVersion: value.schemaVersion,
    registryId: value.registryId,
    revision: value.revision,
    authority: value.sourceOfTruth,
    sbom: value.sbom,
    capabilities,
  };
}

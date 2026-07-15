import {
	assertValidProviderRegistry,
	buildProviderRegistryReadModel,
	type ProviderRegistryManifest,
} from "@lemn-ltd/provider-registry";
import rawManifest from "@lemn-ltd/provider-registry/manifest.json" with {
	type: "json",
};

const manifest: unknown = rawManifest;
assertValidProviderRegistry(manifest);

export const PROVIDER_MANIFEST: ProviderRegistryManifest = manifest;
export const PROVIDER_READ_MODEL = buildProviderRegistryReadModel(manifest);

export const ADMIN_REGISTRY_READ_MODEL = {
	...PROVIDER_READ_MODEL,
	capabilities: PROVIDER_READ_MODEL.capabilities.map((capability) => {
		const source = PROVIDER_MANIFEST.capabilities.find(
			(entry) => entry.capabilityId === capability.capabilityId && entry.providerOfRecord,
		);
		if (!source) throw new Error(`Missing provider record for ${capability.capabilityId}`);
		return {
			...capability,
			licenseRequirements: source.license.requirements,
			patches: source.source.ingestionMode === "source_snapshot" ? source.source.patches : [],
			transforms: source.source.ingestionMode === "source_snapshot" ? source.source.transforms : [],
			snapshot:
				source.source.ingestionMode === "source_snapshot"
					? {
							commitSha: source.source.commitSha,
							selectedSourcePaths: source.source.selectedSourcePaths,
							closure: source.source.closure,
						}
					: null,
			conformance: source.conformance,
		};
	}),
} as const;

export type AdminRegistryReadModel = typeof ADMIN_REGISTRY_READ_MODEL;

import {
	buildProviderRegistryReadModel,
	type ProviderRegistryReadModel,
} from "@lemn-ltd/provider-registry";
import providerRegistryManifest from "@lemn-ltd/provider-registry/manifest.json" with {
	type: "json",
};

/** Exact, release-manifest-derived public read model. */
export const PROVIDER_READ_MODEL: ProviderRegistryReadModel =
	buildProviderRegistryReadModel(providerRegistryManifest);

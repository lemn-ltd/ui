import {
	assertValidProviderRegistry,
	buildProviderRegistryReadModel,
	type ProviderRegistryManifest,
	type ProviderRegistryReadModel,
} from "@lemn-ltd/provider-registry";
import {
	coreComponentCatalog,
	coreComponentExportsFromSlug,
} from "@lemn-ltd/ui/catalog/core";
import rawProviderRegistryManifest from "@lemn-ltd/provider-registry/manifest.json" with {
	type: "json",
};

const providerRegistryManifest: unknown = rawProviderRegistryManifest;
assertValidProviderRegistry(providerRegistryManifest);

export const PROVIDER_MANIFEST: ProviderRegistryManifest =
	providerRegistryManifest;

const fullReadModel = buildProviderRegistryReadModel(PROVIDER_MANIFEST);
const coreExports = new Set(
	coreComponentCatalog.flatMap((entry) => coreComponentExportsFromSlug(entry.slug)),
);

/** Exact, release-manifest-derived read model projected through the enabled Core catalog. */
export const PROVIDER_READ_MODEL: ProviderRegistryReadModel = {
	...fullReadModel,
	capabilities: fullReadModel.capabilities.filter((entry) => coreExports.has(entry.publicExport)),
};

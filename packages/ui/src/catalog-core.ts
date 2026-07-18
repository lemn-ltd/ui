/**
 * Core-only catalog entrypoint. Keep this module free of Agent metadata so
 * Core consumers can bundle the public catalog without evaluating the full
 * cross-area catalog.
 */

import { capabilityExpansionCatalogEntries } from "./catalog-capability-expansion-entries.js";
import { primaryCoreComponentCatalogEntries } from "./catalog-primary-entries.js";
import { secondaryComponentCatalogEntries } from "./catalog-secondary-entries.js";
import type { ComponentCatalogEntry } from "./catalog-types.js";
import { visualizationComponentCatalogEntries } from "./catalog-visualization-entries.js";

export type {
	ComponentArea,
	ComponentCatalogEntry,
	CoreComponentGroup,
} from "./catalog-types.js";

export const coreComponentCatalog: readonly ComponentCatalogEntry[] = [
	...primaryCoreComponentCatalogEntries,
	...secondaryComponentCatalogEntries,
	...visualizationComponentCatalogEntries,
	...capabilityExpansionCatalogEntries,
];

const CORE_COMPONENT_EXPORT_EXCEPTIONS: Readonly<
	Record<string, readonly string[]>
> = {
	radio: ["RadioGroup", "RadioGroupItem"],
	search: ["InputSearch"],
	select: ["InputSelect"],
};

function defaultExportsFromSlug(slug: string): readonly string[] {
	return [
		slug
			.split("-")
			.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
			.join(""),
	];
}

/** Core-only export mapping that remains free of Agent capability metadata. */
export function coreComponentExportsFromSlug(slug: string): readonly string[] {
	return CORE_COMPONENT_EXPORT_EXCEPTIONS[slug] ?? defaultExportsFromSlug(slug);
}

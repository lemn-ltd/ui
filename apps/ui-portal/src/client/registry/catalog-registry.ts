import { buildNavGroups } from "@portal/catalog-kit";
import {
	CATALOG_GROUPS,
	CATALOG_MANIFEST,
} from "../../catalog/catalog-manifest.js";
import type {
	CatalogEntry,
	CatalogGroup,
	CatalogPageBinding,
} from "./catalog-types.js";
import { blockEntries } from "./entries/blocks.js";
import { capabilityExpansionEntries } from "./entries/capability-expansion.js";
import { dataDisplayEntries } from "./entries/data-display.js";
import { feedbackEntries } from "./entries/feedback.js";
import { formsEntries } from "./entries/forms.js";
import { foundationsEntries } from "./entries/foundations.js";
import { layoutEntries } from "./entries/layout.js";
import { navigationEntries } from "./entries/navigation.js";
import { overlaysEntries } from "./entries/overlays.js";
import { patternsEntries } from "./entries/patterns.js";
import { primitivesEntries } from "./entries/primitives.js";
import { visualizationEntries } from "./entries/visualizations.js";

export { CATALOG_GROUPS, pathFor } from "../../catalog/catalog-manifest.js";
export type { CatalogEntry, CatalogGroup } from "./catalog-types.js";

/**
 * React binds implementations by canonical manifest ID only. It cannot add or
 * override metadata, routes, grouping, status, or search text.
 */
const CORE_PAGE_BINDINGS: readonly CatalogPageBinding[] = [
	...foundationsEntries,
	...primitivesEntries,
	...formsEntries,
	...overlaysEntries,
	...navigationEntries,
	...dataDisplayEntries,
	...feedbackEntries,
	...layoutEntries,
	...visualizationEntries,
	...capabilityExpansionEntries,
	...blockEntries,
	...patternsEntries,
];

function bindCatalogPages(
	bindings: readonly CatalogPageBinding[],
): readonly CatalogEntry[] {
	const pagesById = new Map<string, CatalogPageBinding["page"]>();
	for (const binding of bindings) {
		if (pagesById.has(binding.id)) {
			throw new Error(`Duplicate React catalog binding for id "${binding.id}"`);
		}
		pagesById.set(binding.id, binding.page);
	}

	const entries = CATALOG_MANIFEST.map((manifestEntry) => {
		const page = pagesById.get(manifestEntry.id);
		if (!page) {
			throw new Error(
				`Missing React catalog binding for id "${manifestEntry.id}"`,
			);
		}
		pagesById.delete(manifestEntry.id);
		return { ...manifestEntry, page };
	});

	const unknownIds = [...pagesById.keys()];
	if (unknownIds.length > 0) {
		throw new Error(
			`React catalog bindings have no manifest entry: ${unknownIds.join(", ")}`,
		);
	}
	return entries;
}

export const CATALOG_REGISTRY: readonly CatalogEntry[] =
	bindCatalogPages(CORE_PAGE_BINDINGS);

/** Registry grouped in manifest taxonomy order, dropping empty groups. */
export function navGroups(
	registry: readonly CatalogEntry[] = CATALOG_REGISTRY,
): { group: CatalogGroup; entries: CatalogEntry[] }[] {
	return buildNavGroups(registry, CATALOG_GROUPS);
}

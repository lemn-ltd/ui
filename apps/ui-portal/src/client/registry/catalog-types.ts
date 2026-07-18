import type { ReactElement } from "react";
import type {
	CatalogEntryId,
	CatalogManifestEntry,
} from "../../catalog/catalog-manifest.js";

export type {
	CatalogEntryId,
	CatalogGroup,
} from "../../catalog/catalog-manifest.js";

/** The only React-owned catalog declaration: an enabled manifest ID and its page. */
export interface CatalogPageBinding {
	readonly id: CatalogEntryId;
	readonly page: () => ReactElement;
}

export interface CatalogEntry extends CatalogManifestEntry {
	readonly page: () => ReactElement;
}

export function catalogPageBinding(
	id: CatalogEntryId,
	page: () => ReactElement,
): CatalogPageBinding {
	return { id, page };
}

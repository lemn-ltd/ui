import type { ReactElement } from "react";
import { catalogEntryId } from "../../catalog/catalog-manifest.js";
import {
	type CatalogPageBinding,
	catalogPageBinding,
} from "./catalog-types.js";

/** Associates a Core component manifest ID with its lazily imported page only. */
export function componentEntry(
	slug: string,
	page: () => ReactElement,
): CatalogPageBinding {
	return catalogPageBinding(catalogEntryId("component", slug), page);
}

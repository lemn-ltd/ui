import {
	createContext,
	type ReactElement,
	type ReactNode,
	useContext,
} from "react";
import type { CatalogEntry, CatalogEntryMeta } from "./catalog-types.js";

const CatalogEntryContext = createContext<CatalogEntryMeta | undefined>(
	undefined,
);

export interface CatalogEntryProviderProps {
	readonly children: ReactNode;
	readonly entry: CatalogEntry;
}

/** Makes canonical catalog metadata available to page chrome without duplicating it in page files. */
export function CatalogEntryProvider({
	children,
	entry,
}: CatalogEntryProviderProps): ReactElement {
	const { area, group, kind, slug, status, summary, title } = entry;
	const value: CatalogEntryMeta = {
		area,
		group,
		kind,
		slug,
		status,
		summary,
		title,
	};

	return (
		<CatalogEntryContext.Provider value={value}>
			{children}
		</CatalogEntryContext.Provider>
	);
}

export function useCatalogEntryMeta(): CatalogEntryMeta | undefined {
	return useContext(CatalogEntryContext);
}

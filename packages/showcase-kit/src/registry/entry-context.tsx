import {
	createContext,
	type ReactElement,
	type ReactNode,
	useContext,
} from "react";
import type { ShowcaseEntry, ShowcaseEntryMeta } from "./showcase-types.js";

const ShowcaseEntryContext = createContext<ShowcaseEntryMeta | undefined>(
	undefined,
);

export interface ShowcaseEntryProviderProps {
	readonly children: ReactNode;
	readonly entry: ShowcaseEntry;
}

/** Makes canonical catalog metadata available to page chrome without duplicating it in page files. */
export function ShowcaseEntryProvider({
	children,
	entry,
}: ShowcaseEntryProviderProps): ReactElement {
	const { area, group, kind, slug, status, summary, title } = entry;
	const value: ShowcaseEntryMeta = {
		area,
		group,
		kind,
		slug,
		status,
		summary,
		title,
	};

	return (
		<ShowcaseEntryContext.Provider value={value}>
			{children}
		</ShowcaseEntryContext.Provider>
	);
}

export function useShowcaseEntryMeta(): ShowcaseEntryMeta | undefined {
	return useContext(ShowcaseEntryContext);
}

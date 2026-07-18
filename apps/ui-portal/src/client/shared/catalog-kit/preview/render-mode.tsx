import {
	createContext,
	type ReactElement,
	type ReactNode,
	useContext,
} from "react";

export type CatalogRenderMode = "page" | "card" | "playground";

const CatalogRenderModeContext = createContext<CatalogRenderMode>("page");

export interface CatalogRenderModeProviderProps {
	readonly children: ReactNode;
	readonly mode: CatalogRenderMode;
}

export function CatalogRenderModeProvider({
	children,
	mode,
}: CatalogRenderModeProviderProps): ReactElement {
	return (
		<CatalogRenderModeContext.Provider value={mode}>
			{children}
		</CatalogRenderModeContext.Provider>
	);
}

export function useCatalogRenderMode(): CatalogRenderMode {
	return useContext(CatalogRenderModeContext);
}

export function PortalPreviewCanvas({
	children,
}: {
	readonly children: ReactNode;
}): ReactElement {
	const mode = useCatalogRenderMode();

	return (
		<div
			className="portal-render-preview"
			data-portal-preview-content=""
			data-portal-render-mode={mode}
		>
			{children}
		</div>
	);
}

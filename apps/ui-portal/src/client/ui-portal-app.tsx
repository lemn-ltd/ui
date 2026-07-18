import type {
	BrandingDefinition,
	CompiledBrandingArtifact,
} from "@lemn-ltd/brand-contract";
import type { ReactElement } from "react";
import { RouterProvider } from "react-router-dom";
import { BrandRuntimeProvider } from "./branding/brand-runtime";
import { portalRouter } from "./router/router";

export interface UiPortalAppProps {
	readonly initialArtifact: CompiledBrandingArtifact;
	readonly initialDefinition: BrandingDefinition;
}

export function UiPortalApp({
	initialArtifact,
	initialDefinition,
}: UiPortalAppProps): ReactElement {
	return (
		<BrandRuntimeProvider
			initialArtifact={initialArtifact}
			initialDefinition={initialDefinition}
		>
			<RouterProvider router={portalRouter} />
		</BrandRuntimeProvider>
	);
}

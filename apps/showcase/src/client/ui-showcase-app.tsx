import type {
	BrandingDefinition,
	CompiledBrandingArtifact,
} from "@lemn-ltd/brand-contract";
import type { ReactElement } from "react";
import { RouterProvider } from "react-router-dom";
import { BrandRuntimeProvider } from "./branding/brand-runtime";
import { showcaseRouter } from "./router/showcase-router";

export interface UiShowcaseAppProps {
	readonly initialArtifact: CompiledBrandingArtifact;
	readonly initialDefinition: BrandingDefinition;
}

export function UiShowcaseApp({
	initialArtifact,
	initialDefinition,
}: UiShowcaseAppProps): ReactElement {
	return (
		<BrandRuntimeProvider
			initialArtifact={initialArtifact}
			initialDefinition={initialDefinition}
		>
			<RouterProvider router={showcaseRouter} />
		</BrandRuntimeProvider>
	);
}

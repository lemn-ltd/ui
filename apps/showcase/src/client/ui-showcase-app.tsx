import type {
	BrandProject,
	CompiledBrandArtifact,
} from "@lemn-ltd/brand-contract";
import type { ReactElement } from "react";
import { RouterProvider } from "react-router-dom";
import { BrandRuntimeProvider } from "./branding/brand-runtime";
import { showcaseRouter } from "./router/showcase-router";

export interface UiShowcaseAppProps {
	readonly initialArtifact: CompiledBrandArtifact;
	readonly initialProject: BrandProject;
}

export function UiShowcaseApp({
	initialArtifact,
	initialProject,
}: UiShowcaseAppProps): ReactElement {
	return (
		<BrandRuntimeProvider
			initialArtifact={initialArtifact}
			initialProject={initialProject}
		>
			<RouterProvider router={showcaseRouter} />
		</BrandRuntimeProvider>
	);
}

import {
	compileBrandingDefinition,
	getCompiledMode,
	getCompiledModeCriticalCss,
} from "@lemn-ltd/brand-contract";
import { getSystemBrandingTemplate } from "@lemn-ltd/brand-contract/system-brandings";
import "@lemn-ltd/ui/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ShowcaseAdminApp } from "./app";
import "./styles.css";

async function bootstrap(): Promise<void> {
	const definition = structuredClone(
		getSystemBrandingTemplate("aster-vault", 1).definition,
	);
	const compiled = await compileBrandingDefinition(definition);
	if (!compiled.ok) {
		throw new Error("The Admin initial branding did not compile.");
	}
	const mode = getCompiledMode(compiled.artifact, definition.defaultModeId);
	const root = document.getElementById("root");
	if (!root) throw new Error("Missing #root mount point.");
	createRoot(root).render(
		<StrictMode>
			<style data-lemn-brand-critical="showcase-admin">
				{getCompiledModeCriticalCss(compiled.artifact, mode.modeId)}
			</style>
			<div {...mode.attributes} className="showcase-admin-brand-scope">
				<ShowcaseAdminApp />
			</div>
		</StrictMode>,
	);
}

void bootstrap();

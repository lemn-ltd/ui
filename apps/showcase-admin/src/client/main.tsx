import { compileBrandProject, getCompiledScope } from "@lemn-ltd/brand-contract";
import { createBrandFromPreset } from "@lemn-ltd/brand-studio";
import "@lemn-ltd/ui/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ShowcaseAdminApp } from "./app";
import "./styles.css";

async function bootstrap(): Promise<void> {
	const project = createBrandFromPreset("aster-vault");
	const compiled = await compileBrandProject(project);
	if (!compiled.ok) throw new Error("The Admin's initial brand did not compile.");
	const scope = getCompiledScope(compiled.artifact, project.defaultProfileId, "light");
	const root = document.getElementById("root");
	if (!root) throw new Error("Missing #root mount point.");
	createRoot(root).render(
		<StrictMode>
			<style data-lemn-brand-critical="showcase-admin">{compiled.artifact.criticalCss}</style>
			<div {...scope.attributes} className="showcase-admin-brand-scope">
				<ShowcaseAdminApp />
			</div>
		</StrictMode>,
	);
}

void bootstrap();

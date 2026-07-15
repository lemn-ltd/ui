import { createRoot } from "react-dom/client";
import { compileBrandProject } from "@lemn-ltd/brand-contract";
import { createBrandFromPreset } from "@lemn-ltd/brand-studio";
import "@lemn-ltd/ui/styles.css";
import "@lemn-ltd/showcase-kit/styles.css";
import "./styles.css";
import { UiShowcaseApp } from "./ui-showcase-app";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

const initialProject = createBrandFromPreset("verdant-ledger");
const initialCompilation = await compileBrandProject(initialProject);
if (!initialCompilation.ok) {
	throw new Error("The bundled Showcase brand must compile before rendering.");
}

createRoot(root).render(
	<UiShowcaseApp
		initialArtifact={initialCompilation.artifact}
		initialProject={initialProject}
	/>,
);

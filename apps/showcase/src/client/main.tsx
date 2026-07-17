import { compileBrandingDefinition } from "@lemn-ltd/brand-contract";
import { getSystemBrandingTemplate } from "@lemn-ltd/brand-contract/system-brandings";
import { createRoot } from "react-dom/client";
import "@lemn-ltd/ui/styles.css";
import "@lemn-ltd/showcase-kit/styles.css";
import "./styles.css";
import { UiShowcaseApp } from "./ui-showcase-app";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

const initialDefinition = structuredClone(
	getSystemBrandingTemplate("verdant-ledger", 1).definition,
);
const initialCompilation = await compileBrandingDefinition(initialDefinition);
if (!initialCompilation.ok) {
	throw new Error(
		"The bundled Showcase branding must compile before rendering.",
	);
}

createRoot(root).render(
	<UiShowcaseApp
		initialArtifact={initialCompilation.artifact}
		initialDefinition={initialDefinition}
	/>,
);

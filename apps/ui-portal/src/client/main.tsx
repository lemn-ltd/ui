import { compileBrandingDefinition } from "@lemn-ltd/brand-contract";
import { getSystemBrandingTemplate } from "@lemn-ltd/brand-contract/system-brandings";
import { createRoot } from "react-dom/client";
import "@lemn-ltd/ui/styles.css";
import "./shared/catalog-kit/styles.css";
import "./styles.css";
import { UiPortalApp } from "./ui-portal-app";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

const initialDefinition = structuredClone(
	getSystemBrandingTemplate("verdant-ledger", 1).definition,
);
const initialCompilation = await compileBrandingDefinition(initialDefinition);
if (!initialCompilation.ok) {
	throw new Error(
		"The bundled Lemn UI branding must compile before rendering.",
	);
}

createRoot(root).render(
	<UiPortalApp
		initialArtifact={initialCompilation.artifact}
		initialDefinition={initialDefinition}
	/>,
);

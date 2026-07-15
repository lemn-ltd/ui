import { hydrateRoot } from "react-dom/client";
import { compileBrandProject } from "../branding/compiler";
import { parseBrandProject } from "../branding/contract";
import { BrandLabApp } from "../lab/brand-lab-app";
import { isBrandLabInitialState } from "../lab/initial-state";

const root = document.getElementById("root");
const stateElement = document.getElementById("brand-lab-state");

if (
	!(root instanceof HTMLDivElement) ||
	!(stateElement instanceof HTMLScriptElement)
) {
	document.documentElement.dataset.hydration = "unavailable";
} else {
	try {
		const input: unknown = JSON.parse(stateElement.textContent ?? "null");
		if (!isBrandLabInitialState(input)) {
			throw new Error("Invalid server state envelope");
		}

		const project = parseBrandProject(input.activeProject);
		const compiled = compileBrandProject(project);
		const serverHash = document.documentElement.dataset.brandHash;
		if (
			compiled.hash !== input.snapshot.hash ||
			compiled.hash !== serverHash ||
			compiled.version !== input.snapshot.version
		) {
			throw new Error("Server brand identity mismatch");
		}

		hydrateRoot(root, <BrandLabApp initialState={input} />, {
			onRecoverableError() {
				document.documentElement.dataset.hydration = "recovered";
			},
		});
		document.documentElement.dataset.hydration = "ready";
	} catch {
		// Keep the complete branded SSR document visible and inert. A malformed
		// hydration envelope must never replace it with an unbranded client tree.
		document.documentElement.dataset.hydration = "rejected";
	}
}

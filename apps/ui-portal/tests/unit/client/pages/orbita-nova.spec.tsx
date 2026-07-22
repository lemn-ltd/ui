// @vitest-environment happy-dom

import {
	type CompiledBrandingArtifact,
	compileBrandingDefinition,
} from "@lemn-ltd/brand-contract";
import {
	getSystemBrandingTemplate,
	systemBrandingTemplates,
} from "@lemn-ltd/brand-contract/system-brandings";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { BrandRuntimeProvider } from "../../../../src/client/branding/brand-runtime.js";
import OrbitaNovaPage from "../../../../src/client/pages/demos/orbita-nova.page.js";

const initialDefinition = structuredClone(
	getSystemBrandingTemplate("verdant-ledger", 1).definition,
);
let initialArtifact: CompiledBrandingArtifact;

beforeAll(async () => {
	const result = await compileBrandingDefinition(initialDefinition);
	if (!result.ok)
		throw new Error("Expected the System branding fixture to compile");
	initialArtifact = result.artifact;
});

afterEach(() => {
	cleanup();
	document.documentElement.removeAttribute("data-theme");
});

function renderPage(): void {
	render(
		<BrandRuntimeProvider
			initialArtifact={initialArtifact}
			initialDefinition={initialDefinition}
		>
			<OrbitaNovaPage />
		</BrandRuntimeProvider>,
	);
}

describe("OrbitaNovaPage", () => {
	it("renders the corporate experience with every available System branding", () => {
		renderPage();

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "Tu próxima aventura no está en este mundo.",
			}),
		).toBeDefined();
		const select = screen.getByLabelText("Branding") as HTMLSelectElement;
		expect(select.options).toHaveLength(
			systemBrandingTemplates.filter(
				(template) => template.status === "available",
			).length,
		);
		for (const attraction of [
			"Comet Chase",
			"Zero-G Dome",
			"Biolume Gardens",
		]) {
			expect(
				screen.getByRole("heading", { level: 3, name: attraction }),
			).toBeDefined();
		}
	});

	it("applies a selected branding and switches the controlled color mode", async () => {
		renderPage();

		const select = screen.getByLabelText("Branding") as HTMLSelectElement;
		fireEvent.change(select, { target: { value: "night-bloom" } });
		await waitFor(() => expect(select.value).toBe("night-bloom"));
		expect(screen.getByText(/Magenta energy/)).toBeDefined();

		fireEvent.click(
			screen.getByRole("button", { name: "Switch to dark theme" }),
		);
		await waitFor(() =>
			expect(document.documentElement.dataset.theme).toBe("dark"),
		);
	});
});

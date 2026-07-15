import { describe, expect, it } from "vitest";
import { componentSelections } from "../../../src/providers/component-manifest";

describe("componentSelections", () => {
	it("selects exactly one provider owner for each MVP capability", () => {
		expect(componentSelections).toHaveLength(5);
		expect(
			new Set(componentSelections.map(({ capability }) => capability)).size,
		).toBe(5);
		expect(componentSelections.map(({ capability }) => capability)).toEqual([
			"button",
			"checkbox",
			"area-chart",
			"bar-chart",
			"donut-chart",
		]);
	});

	it("records immutable provenance and approved open-source licenses", () => {
		for (const selection of componentSelections) {
			expect(selection.provider.immutableRef).toMatch(/^[a-f0-9]{40}$/);
			expect(selection.provider.version).not.toHaveLength(0);
			expect(["Apache-2.0", "MIT"]).toContain(selection.provider.license);
			expect(selection.integration.nativeApiPreserved).toBe(true);
			expect(selection.integration.dependencies.length).toBeGreaterThan(0);
			for (const dependency of selection.integration.dependencies) {
				expect(dependency.version).not.toHaveLength(0);
				expect(["Apache-2.0", "ISC", "MIT"]).toContain(dependency.license);
			}
		}

		const checkbox = componentSelections.find(
			({ capability }) => capability === "checkbox",
		);
		expect(checkbox).toBeDefined();
		expect(checkbox && "source" in checkbox.integration).toBe(true);
		if (checkbox && "source" in checkbox.integration) {
			expect(checkbox.integration.source.sha256).toMatch(/^[a-f0-9]{64}$/);
		}
	});

	it("uses only explicit component or modular provider entrypoints", () => {
		const imports = componentSelections.flatMap(
			({ integration }) => integration.imports,
		);

		expect(imports).toContain("react-aria-components/Button");
		expect(imports).toContain("@radix-ui/react-checkbox");
		expect(imports).toEqual(
			expect.arrayContaining([
				"echarts/core",
				"echarts/charts",
				"echarts/components",
				"echarts/renderers",
			]),
		);
		expect(
			imports.filter((entrypoint) => entrypoint === "recharts"),
		).toHaveLength(2);
		expect(imports).not.toContain("react-aria-components");
		expect(imports).not.toContain("radix-ui");
		expect(imports).not.toContain("echarts");
	});
});

import { describe, expect, it } from "vitest";
import { compileBrandProject } from "../../../src/branding/compiler";
import { defaultBrandProject } from "../../../src/branding/presets";
import { renderAreaChartSvg } from "../../../src/providers/echarts/area-chart-runtime";

describe("renderAreaChartSvg", () => {
	it("renders a complete server-side SVG with the compiled chart brand", () => {
		const snapshot = compileBrandProject(defaultBrandProject);
		const svg = renderAreaChartSvg(snapshot, 640, 320);

		expect(svg).toMatch(/^<svg\b/);
		expect(svg).toContain('viewBox="0 0 640 320"');
		expect(svg).toContain(snapshot.chartTheme.color[0]);
		expect(svg).toContain(snapshot.chartTheme.color[1]);
		expect(svg).toContain("Reports");
		expect(svg).toContain("Automations");
	});

	it("changes provider-rendered output when the compiled project changes", () => {
		const first = compileBrandProject(defaultBrandProject);
		const second = compileBrandProject({
			...defaultBrandProject,
			colors: {
				...defaultBrandProject.colors,
				chartPrimary: "#123456",
				chartSecondary: "#abcdef",
			},
		});

		const firstSvg = renderAreaChartSvg(first);
		const secondSvg = renderAreaChartSvg(second);

		expect(firstSvg).not.toBe(secondSvg);
		expect(secondSvg).toContain("#123456");
		expect(secondSvg).toContain("#abcdef");
	});
});

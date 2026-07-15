import { describe, expect, it } from "vitest";
import {
	compileBrandProject,
	getCompiledScope,
	verifyBrandArtifact,
} from "../index.js";
import { makeBrandProject } from "./fixtures.js";

describe("compiled CSS and visualization adapters", () => {
	it("emits complete CSS under artifact, profile, and mode scopes", async () => {
		const result = await compileBrandProject(makeBrandProject());

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		const { artifact } = result;
		expect(Object.keys(artifact.scopes)).toEqual([
			"core/light",
			"core/dark",
			"pediatrics/light",
			"pediatrics/dark",
		]);

		for (const scope of Object.values(artifact.scopes)) {
			expect(scope.id).toMatch(/^[a-f0-9]{64}-[a-z0-9-]+-[a-z0-9-]+$/);
			expect(scope.selector).toBe(`[data-lemn-brand-scope="${scope.id}"]`);
			expect(scope.attributes).toMatchObject({
				"data-lemn-brand-scope": scope.id,
				"data-lemn-brand": expect.stringMatching(/^[a-f0-9]{64}$/),
				"data-lemn-profile": scope.profileId,
				"data-lemn-mode": scope.modeId,
			});
			expect(artifact.criticalCss).toContain(`${scope.selector} {`);
			expect(artifact.criticalCss).toContain(
				`  color-scheme: ${scope.colorScheme};`,
			);
			expect(scope.tokens).toMatchObject({
				"--lemn-color-canvas": expect.stringMatching(/^#/),
				"--lemn-color-accent": expect.stringMatching(/^#/),
				"--lemn-font-body": expect.any(String),
				"--lemn-radius-control": expect.any(String),
				"--lemn-chart-series-1": expect.any(String),
			});
		}

		expect(artifact.criticalCss).not.toContain("--lunaria-");
		expect(artifact.criticalCss).not.toContain("--project-");
	});

	it("keeps categorical identity and chart semantics coherent across Recharts and ECharts", async () => {
		const result = await compileBrandProject(makeBrandProject());
		if (!result.ok) throw new Error("Fixture must compile");
		const scope = getCompiledScope(result.artifact, "core", "light");
		const categoryAxis = scope.echarts.categoryAxis as {
			axisLabel: { color: string };
			splitLine: { lineStyle: { color: string } };
		};
		const tooltip = scope.echarts.tooltip as {
			backgroundColor: string;
			borderColor: string;
			textStyle: { color: string };
		};

		expect(scope.echarts.color).toEqual(scope.recharts.series);
		scope.recharts.series.forEach((color, index) => {
			expect(scope.tokens[`--lemn-chart-series-${index + 1}`]).toBe(color);
		});
		expect(scope.recharts).toMatchObject({
			positive: scope.tokens["--lemn-chart-positive"],
			negative: scope.tokens["--lemn-chart-negative"],
			neutral: scope.tokens["--lemn-chart-neutral"],
			axis: scope.tokens["--lemn-chart-axis"],
			grid: scope.tokens["--lemn-chart-grid"],
		});
		expect(categoryAxis.axisLabel.color).toBe(scope.recharts.axis);
		expect(categoryAxis.splitLine.lineStyle.color).toBe(scope.recharts.grid);
		expect(tooltip).toMatchObject({
			backgroundColor: scope.recharts.tooltip.background,
			borderColor: scope.recharts.tooltip.border,
			textStyle: { color: scope.recharts.tooltip.text },
		});
	});

	it("verifies the complete compiled payload and rejects tampering", async () => {
		const result = await compileBrandProject(makeBrandProject());
		if (!result.ok) throw new Error("Fixture must compile");
		await expect(verifyBrandArtifact(result.artifact)).resolves.toBeUndefined();

		const tampered = structuredClone(result.artifact);
		(tampered.scopes["core/light"]?.tokens as Record<string, string>)[
			"--lemn-color-accent"
		] = "#000000";
		await expect(verifyBrandArtifact(tampered)).rejects.toThrow(
			"Brand artifact integrity check failed",
		);
	});
});

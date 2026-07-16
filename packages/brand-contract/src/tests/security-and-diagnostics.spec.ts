import { describe, expect, it } from "vitest";
import {
	compileBrandProject,
	safeParseBrandProject,
	serializeBootstrapJson,
	serializeBrandBootstrap,
} from "../index.js";
import { fixtureMode, fixtureProfile, makeBrandProject } from "./fixtures.js";

describe("diagnostics and safe server bootstrap", () => {
	it("blocks required contrast failures with measurable diagnostics and a safe suggestion", async () => {
		const project = makeBrandProject();
		const light = fixtureMode(project, "core", "light");
		light.colors.accent = "#ffffff";
		light.colors.accentForeground = "#fefefe";

		const result = await compileBrandProject(project);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		const diagnostic = result.diagnostics.find(
			(entry) => entry.path === "profiles.core.modes.light.accentForeground",
		);
		expect(diagnostic).toMatchObject({
			code: "BRAND_CONTRAST_REQUIRED",
			severity: "error",
			required: 4.5,
			suggestion: "#000000",
		});
		expect(diagnostic?.actual).toBeLessThan(1.1);
	});

	it("keeps low chart-grid contrast non-blocking and visible as a warning", async () => {
		const project = makeBrandProject();
		fixtureMode(project, "core", "light").visualization.grid = "#ffffff";

		const result = await compileBrandProject(project);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.diagnostics).toContainEqual(
			expect.objectContaining({
				code: "BRAND_CHART_GRID_LOW_CONTRAST",
				severity: "warning",
				path: "profiles.core.modes.light.visualization.grid",
			}),
		);
	});

	it("escapes HTML-sensitive and JavaScript line-separator characters", () => {
		const serialized = serializeBootstrapJson({
			payload: "</script><script>alert('xss')</script>&\u2028\u2029",
		});

		expect(serialized).not.toMatch(/[<>&\u2028\u2029]/u);
		expect(serialized).toContain("\\u003c/script\\u003e");
		expect(JSON.parse(serialized)).toEqual({
			payload: "</script><script>alert('xss')</script>&\u2028\u2029",
		});
	});

	it("serializes a compiled scope into a parseable anti-XSS bootstrap payload", async () => {
		const result = await compileBrandProject(makeBrandProject());
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		const bootstrap = serializeBrandBootstrap(result.artifact, "core", "light");

		expect(bootstrap).not.toMatch(/[<>&\u2028\u2029]/u);
		expect(JSON.parse(bootstrap)).toMatchObject({
			profileId: "core",
			modeId: "light",
				echarts: {
					textStyle: {
						fontFamily:
							'system-ui, sans-serif, Arial, Helvetica, "Liberation Sans"',
					},
				},
			});
		});

	it("rejects font references and weights outside the versioned catalog", () => {
		const unknownReference = makeBrandProject();
		const unknownTypography = fixtureProfile(unknownReference, "core").typography;
		if (!unknownTypography || unknownTypography.body.source === "inherit") {
			throw new Error("Fixture must declare direct body typography");
		}
		(unknownTypography.body as unknown as { ref: string }).ref =
			'managed.inter";}body{display:none}/*';
		expect(safeParseBrandProject(unknownReference).success).toBe(false);

		const invalidWeight = makeBrandProject();
		const invalidTypography = fixtureProfile(invalidWeight, "core").typography;
		if (!invalidTypography || invalidTypography.body.source === "inherit") {
			throw new Error("Fixture must declare direct body typography");
		}
		(invalidTypography.body as unknown as { weights: number[] }).weights = [450];
		expect(safeParseBrandProject(invalidWeight).success).toBe(false);
	});
});

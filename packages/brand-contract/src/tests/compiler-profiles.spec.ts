import { describe, expect, it } from "vitest";
import {
	brandScopeKey,
	compileBrandProject,
	getCompiledScope,
	safeParseBrandProject,
} from "../index.js";
import { fixtureProfile, makeBrandProject, makeMode } from "./fixtures.js";

describe("profile and mode resolution", () => {
	it("resolves inherited modes, defaults, assets, and an overridden descendant mode", async () => {
		const project = makeBrandProject();
		fixtureProfile(project, "pediatrics").modes.dark = {
			...makeMode("dark"),
			colors: {
				...makeMode("dark").colors,
				accent: "#c084fc",
				accentForeground: "#111827",
			},
		};

		const result = await compileBrandProject(project);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		const child = result.artifact.profiles.pediatrics;
		expect(child).toMatchObject({
			id: "pediatrics",
			defaultMode: "dark",
			assets: { primaryLogo: "logo-main" },
		});
		expect(Object.keys(child?.modes ?? {})).toEqual(["light", "dark"]);
		expect(child?.modes.light).toEqual(
			result.artifact.profiles.core?.modes.light,
		);
		expect(child?.modes.dark?.colors.accent).toBe("#c084fc");

		expect(brandScopeKey("pediatrics", "light")).toBe("pediatrics/light");
		expect(getCompiledScope(result.artifact, "pediatrics").modeId).toBe("dark");
		expect(
			getCompiledScope(result.artifact, "pediatrics", "light").modeId,
		).toBe("light");
	});

	it("reports an inheritance cycle without producing an artifact", async () => {
		const project = makeBrandProject();
		fixtureProfile(project, "core").extends = "pediatrics";

		const result = await compileBrandProject(project);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.sourceHash).toMatch(/^[a-f0-9]{64}$/);
		expect(result.diagnostics).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					code: "BRAND_PROFILE_CYCLE",
					severity: "error",
					path: expect.stringMatching(/^profiles\.(core|pediatrics)\.extends$/),
				}),
			]),
		);
	});

	it("rejects missing parents, self inheritance, empty roots, and dangling assets", () => {
		const missingParent = makeBrandProject();
		fixtureProfile(missingParent, "pediatrics").extends = "unknown-profile";
		expect(safeParseBrandProject(missingParent).success).toBe(false);

		const selfCycle = makeBrandProject();
		fixtureProfile(selfCycle, "pediatrics").extends = "pediatrics";
		expect(safeParseBrandProject(selfCycle).success).toBe(false);

		const emptyRoot = makeBrandProject();
		fixtureProfile(emptyRoot, "core").modes = {};
		expect(safeParseBrandProject(emptyRoot).success).toBe(false);

		const danglingAsset = makeBrandProject();
		const core = fixtureProfile(danglingAsset, "core");
		if (!core.assets) throw new Error("Fixture must have profile assets");
		core.assets.primaryLogo = "missing-logo";
		expect(safeParseBrandProject(danglingAsset).success).toBe(false);
	});

	it("reports a default mode that does not resolve after inheritance", async () => {
		const project = makeBrandProject();
		fixtureProfile(project, "pediatrics").defaultMode = "sepia";

		const result = await compileBrandProject(project);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.diagnostics).toContainEqual(
			expect.objectContaining({
				code: "BRAND_DEFAULT_MODE_INVALID",
				path: "profiles.pediatrics.defaultMode",
			}),
		);
	});

	it("throws clear lookup errors for unknown profiles and modes", async () => {
		const result = await compileBrandProject(makeBrandProject());
		if (!result.ok) throw new Error("Fixture must compile");

		expect(() => getCompiledScope(result.artifact, "unknown")).toThrow(
			"Unknown brand profile",
		);
		expect(() => getCompiledScope(result.artifact, "core", "sepia")).toThrow(
			"Unknown mode",
		);
	});
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
	BRAND_COMPILER_VERSION,
	BRAND_PROJECT_SCHEMA_URL,
	BRAND_SCHEMA_VERSION,
	compileBrandProject,
	FONT_CATALOG_VERSION,
	fontCatalog,
	getCompiledScope,
	getCompiledScopeFontPreloads,
	getCompiledScopeFontResources,
	MANAGED_FONT_REFS,
	SYSTEM_FONT_REFS,
	serializeBrandBootstrap,
} from "../index.js";
import { fixtureProfile, makeBrandProject } from "./fixtures.js";

describe("BrandProject v2 font catalog", () => {
	it("matches the verified Cloudflare CDN manifest exactly", () => {
		const manifest = JSON.parse(
			readFileSync(
				new URL("../../../../scripts/fonts/catalog.json", import.meta.url),
				"utf8",
			),
		) as {
			families: Array<{
				id: string;
				license: {
					url: string;
					publicUrl: string;
					expectedSha256: string;
					copyright: string;
				};
				source: {
					directoryUrl: string;
					upstreamProjectUrl: string;
				};
				faces: Array<{
					style: "normal" | "italic";
					unicodeRange: string;
					expectedSha256: string;
					expectedBytes: number;
					publicUrl: string;
				}>;
			}>;
		};
		const managed = fontCatalog.filter((record) => record.source === "managed");

		for (const record of managed) {
			const family = manifest.families.find(
				(entry) => `managed.${entry.id}` === record.ref,
			);
			expect(family, `missing manifest family for ${record.ref}`).toBeDefined();
			if (!family) continue;
			expect(record.licenseUrl).toBe(family.license.url);
			expect(record.licenseArtifactUrl).toBe(family.license.publicUrl);
			expect(record.licenseSha256).toBe(family.license.expectedSha256);
			expect(record.copyrightNotice).toBe(family.license.copyright);
			expect(record.sourceUrl).toBe(family.source.directoryUrl);
			expect(record.upstreamProjectUrl).toBe(family.source.upstreamProjectUrl);
			expect(record.resources).toHaveLength(family.faces.length);
			for (const resource of record.resources) {
				const face = family.faces.find(
					(entry) => entry.style === resource.style,
				);
				expect(
					face,
					`missing ${resource.style} face for ${record.ref}`,
				).toBeDefined();
				expect(resource).toMatchObject({
					url: face?.publicUrl,
					sha256: face?.expectedSha256,
					estimatedBytes: face?.expectedBytes,
					unicodeRange: face?.unicodeRange,
					provisional: false,
				});
			}
		}
	});

	it("exports one versioned curated catalog and the v2 contract identity", () => {
		expect(BRAND_PROJECT_SCHEMA_URL).toBe(
			"https://schemas.ui.le-mn.com/brand-project/v2.json",
		);
		expect(BRAND_SCHEMA_VERSION).toBe(2);
		expect(BRAND_COMPILER_VERSION).toBe("2.0.0");
		expect(FONT_CATALOG_VERSION).toBe(1);
		expect(fontCatalog.map((record) => record.ref)).toEqual([
			...SYSTEM_FONT_REFS,
			...MANAGED_FONT_REFS,
		]);
		expect(
			fontCatalog.filter((record) => record.source === "system"),
		).toHaveLength(4);
		expect(
			fontCatalog.filter((record) => record.source === "managed"),
		).toHaveLength(8);
	});

	it("keeps every exported catalog record and nested resource immutable at runtime", () => {
		const system = fontCatalog.find((record) => record.ref === "system.ui");
		const managed = fontCatalog.find(
			(record) => record.ref === "managed.inter",
		);
		expect(system?.source).toBe("system");
		expect(managed?.source).toBe("managed");
		if (
			!system ||
			system.source !== "system" ||
			!managed ||
			managed.source !== "managed"
		) {
			throw new Error("Expected system and managed catalog records");
		}
		const resource = managed.resources[0];
		if (!resource) throw new Error("Expected a managed font resource");

		expect(Object.isFrozen(fontCatalog)).toBe(true);
		expect(Object.isFrozen(system)).toBe(true);
		expect(Object.isFrozen(system.cssStack)).toBe(true);
		expect(Object.isFrozen(managed)).toBe(true);
		expect(Object.isFrozen(managed.resources)).toBe(true);
		expect(Object.isFrozen(resource)).toBe(true);

		expect(() => {
			(managed as { label: string }).label = "Attacker controlled";
		}).toThrow(TypeError);
		expect(() => {
			(system.cssStack as string[]).push("attacker-controlled-font");
		}).toThrow(TypeError);
		expect(() => {
			(resource as { url: string }).url = "https://example.com/untrusted.woff2";
		}).toThrow(TypeError);
		expect(resource.url).toBe(
			"https://fonts.ui.le-mn.com/v2/3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62/inter-latin-variable-normal.woff2",
		);
	});

	it("emits no font resources or font network policy for system-only typography", async () => {
		const result = await compileBrandProject(makeBrandProject());
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.artifact.fontResources).toEqual([]);
		expect(result.artifact.estimatedFontBytes).toBe(0);
		expect(result.artifact.fontNetworkPolicy).toEqual({
			mode: "none",
			requiresNetwork: false,
			allowedOrigins: [],
			emergencyFallbackRequired: true,
		});
		expect(result.artifact.criticalCss).not.toContain("@font-face");
		expect(
			getCompiledScopeFontPreloads(result.artifact, "core", "light"),
		).toEqual([]);
		expect(
			getCompiledScope(result.artifact, "core", "light").tokens[
				"--lemn-font-body"
			],
		).toBe('system-ui, sans-serif, Arial, Helvetica, "Liberation Sans"');
	});

	it("emits only selected managed resources with an SSR-ready fallback stack", async () => {
		const project = makeBrandProject();
		const typography = fixtureProfile(project, "core").typography;
		if (!typography) throw new Error("Fixture must declare typography");
		typography.body = {
			source: "managed",
			ref: "managed.inter",
			fidelity: "required",
			emergencyFallbackRef: "system.ui",
			weights: [400, 500, 600],
			styles: ["normal"],
		};

		const result = await compileBrandProject(project);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.artifact.fontResources).toHaveLength(2);
		expect(result.artifact.fontResources).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: "core.required.managed.inter.normal.variable-latin",
					profileId: "core",
					catalogRef: "managed.inter",
					fidelity: "required",
					preload: true,
					fontDisplay: "block",
					provisional: false,
					subset: "latin",
					sha256:
						"3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62",
				}),
				expect.objectContaining({
					id: "pediatrics.required.managed.inter.normal.variable-latin",
					profileId: "pediatrics",
				}),
			]),
		);
		expect(result.artifact.estimatedFontBytes).toBeGreaterThan(0);
		expect(result.artifact.estimatedFontBytes).toBe(
			result.artifact.fontResources[0]?.estimatedBytes,
		);
		expect(result.artifact.fontNetworkPolicy).toEqual({
			mode: "managed-immutable-cdn",
			requiresNetwork: true,
			allowedOrigins: ["https://fonts.ui.le-mn.com"],
			emergencyFallbackRequired: true,
		});
		expect(result.artifact.criticalCss).toContain(
			'@font-face {\n  font-family: "Lemn Managed Inter--lemn-core-required";',
		);
		expect(result.artifact.criticalCss).toContain("font-style: normal;");
		expect(result.artifact.criticalCss).toContain("unicode-range: U+0000-00FF");
		expect(result.artifact.criticalCss).not.toContain(
			"inter-latin-variable-italic.woff2",
		);
		expect(
			getCompiledScope(result.artifact, "core", "dark").tokens[
				"--lemn-font-body"
			],
		).toBe('"Lemn Managed Inter--lemn-core-required", system-ui, sans-serif');
		expect(
			getCompiledScope(result.artifact, "pediatrics", "light").tokens[
				"--lemn-font-body"
			],
		).toBe(
			'"Lemn Managed Inter--lemn-pediatrics-required", system-ui, sans-serif',
		);
		expect(
			getCompiledScopeFontResources(result.artifact, "core", "light"),
		).toHaveLength(1);
		expect(
			getCompiledScopeFontResources(result.artifact, "core", "light")[0]
				?.profileId,
		).toBe("core");
		expect(
			getCompiledScopeFontPreloads(result.artifact, "core", "light"),
		).toEqual([
			expect.objectContaining({
				resourceId: "core.required.managed.inter.normal.variable-latin",
				rel: "preload",
				as: "font",
				type: "font/woff2",
				crossOrigin: "anonymous",
				integrity:
					"sha256-MQDndehhbNJhG+7PojpCY9cDdYZ4m0PwNSNqLm+9TGI=",
			}),
		]);
	});

	it("isolates managed-font policy and SSR bootstrap resources between profiles", async () => {
		const project = makeBrandProject();
		const core = fixtureProfile(project, "core");
		if (!core.typography) throw new Error("Fixture must declare typography");
		core.typography.body = {
			source: "managed",
			ref: "managed.inter",
			fidelity: "preferred",
			emergencyFallbackRef: "system.ui",
			weights: [400, 500],
			styles: ["normal"],
		};
		const pediatrics = fixtureProfile(project, "pediatrics");
		pediatrics.typography = structuredClone(core.typography);
		pediatrics.typography.body = {
			...pediatrics.typography.body,
			fidelity: "required",
		};

		const result = await compileBrandProject(project);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		const coreResources = getCompiledScopeFontResources(
			result.artifact,
			"core",
			"light",
		);
		const pediatricsResources = getCompiledScopeFontResources(
			result.artifact,
			"pediatrics",
			"dark",
		);
		expect(coreResources).toEqual([
			expect.objectContaining({
				profileId: "core",
				fidelity: "preferred",
				fontDisplay: "optional",
				preload: false,
			}),
		]);
		expect(pediatricsResources).toEqual([
			expect.objectContaining({
				profileId: "pediatrics",
				fidelity: "required",
				fontDisplay: "block",
				preload: true,
			}),
		]);
		expect(coreResources[0]?.family).not.toBe(pediatricsResources[0]?.family);
		expect(
			getCompiledScopeFontPreloads(result.artifact, "core", "light"),
		).toEqual([]);
		const pediatricsPreloads = getCompiledScopeFontPreloads(
			result.artifact,
			"pediatrics",
			"dark",
		);
		expect(pediatricsPreloads).toHaveLength(1);
		expect(pediatricsPreloads[0]?.resourceId).toMatch(/^pediatrics\./);
		expect(new Set(pediatricsPreloads.map((preload) => preload.href)).size).toBe(
			pediatricsPreloads.length,
		);
		expect(
			getCompiledScope(result.artifact, "core", "light").fontResourceIds,
		).toEqual(coreResources.map((resource) => resource.id));
		expect(
			getCompiledScope(result.artifact, "pediatrics", "dark").fontResourceIds,
		).toEqual(pediatricsResources.map((resource) => resource.id));

		const coreBootstrap = JSON.parse(
			serializeBrandBootstrap(result.artifact, "core", "light"),
		) as {
			fontResources: Array<{ profileId: string; fontDisplay: string }>;
			estimatedFontBytes: number;
		};
		const pediatricsBootstrap = JSON.parse(
			serializeBrandBootstrap(result.artifact, "pediatrics", "dark"),
		) as {
			fontResources: Array<{ profileId: string; fontDisplay: string }>;
			estimatedFontBytes: number;
		};
		expect(coreBootstrap.fontResources).toEqual([
			expect.objectContaining({ profileId: "core", fontDisplay: "optional" }),
		]);
		expect(pediatricsBootstrap.fontResources).toEqual([
			expect.objectContaining({
				profileId: "pediatrics",
				fontDisplay: "block",
			}),
		]);
		expect(coreBootstrap.estimatedFontBytes).toBe(
			coreResources[0]?.estimatedBytes,
		);
		expect(pediatricsBootstrap.estimatedFontBytes).toBe(
			pediatricsResources[0]?.estimatedBytes,
		);
	});
});

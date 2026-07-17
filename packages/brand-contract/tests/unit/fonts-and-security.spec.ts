import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
	compileBrandingDefinition,
	FONT_CATALOG_VERSION,
	fontCatalog,
	getCompiledMode,
	getCompiledModeFontPreloads,
	getCompiledModeFontResourceOrigins,
	getCompiledModeFontResources,
	MANAGED_FONT_REFS,
	SYSTEM_FONT_REFS,
	safeParseBrandingDefinition,
	serializeBootstrapJson,
} from "../../src/index.js";
import {
	fixtureMode,
	makeBrandingDefinition,
} from "../fixtures/branding-definition.js";

describe("font governance and safe serialization", () => {
	it("matches the verified managed CDN manifest", () => {
		const manifest = JSON.parse(
			readFileSync(
				new URL("../../../../scripts/fonts/catalog.json", import.meta.url),
				"utf8",
			),
		) as {
			families: Array<{
				id: string;
				faces: Array<{
					style: string;
					expectedSha256: string;
					expectedBytes: number;
					publicUrl: string;
				}>;
			}>;
		};
		for (const record of fontCatalog.filter(
			(entry) => entry.source === "managed",
		)) {
			const family = manifest.families.find(
				(entry) => `managed.${entry.id}` === record.ref,
			);
			expect(family, `missing manifest family for ${record.ref}`).toBeDefined();
			for (const resource of record.resources) {
				const face = family?.faces.find(
					(entry) => entry.style === resource.style,
				);
				expect(resource).toMatchObject({
					url: face?.publicUrl,
					sha256: face?.expectedSha256,
					estimatedBytes: face?.expectedBytes,
					provisional: false,
				});
			}
		}
		expect(FONT_CATALOG_VERSION).toBe(1);
		expect(fontCatalog.map((entry) => entry.ref)).toEqual([
			...SYSTEM_FONT_REFS,
			...MANAGED_FONT_REFS,
		]);
	});

	it("emits no network resources for system typography", async () => {
		const result = await compileBrandingDefinition(makeBrandingDefinition());
		if (!result.ok) throw new Error("Fixture must compile");
		expect(result.artifact.fontResources).toEqual([]);
		expect(result.artifact.fontNetworkPolicy).toEqual({
			mode: "none",
			requiresNetwork: false,
			allowedOrigins: [],
			emergencyFallbackRequired: true,
		});
		expect(result.artifact.fontCss).toBe("");
		expect(getCompiledModeFontPreloads(result.artifact, "light")).toEqual([]);
		expect(
			getCompiledModeFontResourceOrigins(result.artifact, "light"),
		).toEqual([]);
	});

	it("exposes preferred managed font origins without forcing a preload", async () => {
		const definition = makeBrandingDefinition();
		definition.typography.body = {
			source: "managed",
			ref: "managed.inter",
			fidelity: "preferred",
			emergencyFallbackRef: "system.ui",
			weights: [400, 500, 600],
			styles: ["normal"],
		};
		const result = await compileBrandingDefinition(definition);
		if (!result.ok) throw new Error("Managed fixture must compile");
		expect(getCompiledModeFontPreloads(result.artifact, "light")).toEqual([]);
		expect(
			getCompiledModeFontResourceOrigins(result.artifact, "light"),
		).toEqual(["https://fonts.ui.le-mn.com"]);
		expect(result.artifact.fontCss).toContain("font-display: optional");
	});

	it("emits one shared managed family and SSR preload for required typography", async () => {
		const definition = makeBrandingDefinition();
		definition.typography.body = {
			source: "managed",
			ref: "managed.inter",
			fidelity: "required",
			emergencyFallbackRef: "system.ui",
			weights: [400, 500, 600],
			styles: ["normal"],
		};
		const result = await compileBrandingDefinition(definition);
		if (!result.ok) throw new Error("Managed fixture must compile");
		expect(result.artifact.fontResources).toHaveLength(1);
		expect(getCompiledModeFontResources(result.artifact, "dark")).toHaveLength(
			1,
		);
		expect(getCompiledModeFontPreloads(result.artifact, "light")).toEqual([
			expect.objectContaining({
				rel: "preload",
				as: "font",
				type: "font/woff2",
				crossOrigin: "anonymous",
			}),
		]);
		expect(
			getCompiledModeFontResourceOrigins(result.artifact, "light"),
		).toEqual(["https://fonts.ui.le-mn.com"]);
		expect(result.artifact.fontCss).toContain("font-display: block");
		expect(
			getCompiledMode(result.artifact, "light").tokens["--lemn-font-body"],
		).toContain("Lemn Managed Inter");
	});

	it("rejects credentialed font resources before projecting a CSP origin", async () => {
		const definition = makeBrandingDefinition();
		definition.typography.body = {
			source: "managed",
			ref: "managed.inter",
			fidelity: "preferred",
			emergencyFallbackRef: "system.ui",
			weights: [400],
			styles: ["normal"],
		};
		const result = await compileBrandingDefinition(definition);
		if (!result.ok) throw new Error("Managed fixture must compile");
		const artifact = structuredClone(result.artifact);
		const resource = artifact.fontResources[0];
		if (!resource) throw new Error("Managed fixture needs a font resource");
		(resource as { url: string }).url =
			"https://user:secret@fonts.ui.le-mn.com/font.woff2";
		expect(() => getCompiledModeFontResourceOrigins(artifact, "light")).toThrow(
			"canonical HTTPS",
		);
	});

	it("blocks unsafe font input and escapes bootstrap-sensitive characters", () => {
		const definition = makeBrandingDefinition();
		(definition.typography.body as unknown as { ref: string }).ref =
			'managed.inter";}body{display:none}/*';
		expect(safeParseBrandingDefinition(definition).success).toBe(false);
		const serialized = serializeBootstrapJson({
			payload: "</script><script>alert(1)</script>&\u2028\u2029",
		});
		expect(serialized).not.toMatch(/[<>&\u2028\u2029]/u);
	});
});

describe("compiler diagnostics", () => {
	it("blocks required contrast failures and reports mode-root paths", async () => {
		const definition = makeBrandingDefinition();
		const light = fixtureMode(definition, "light");
		light.colors.accent = "#ffffff";
		light.colors.accentForeground = "#fefefe";
		const result = await compileBrandingDefinition(definition);
		expect(result.ok).toBe(false);
		expect(result.diagnostics).toContainEqual(
			expect.objectContaining({
				code: "BRANDING_CONTRAST_REQUIRED",
				severity: "error",
				path: "modes.light.accentForeground",
				suggestion: "#000000",
			}),
		);
	});

	it("keeps low chart-grid contrast visible but non-blocking", async () => {
		const definition = makeBrandingDefinition();
		fixtureMode(definition, "light").visualization.grid = "#f5f6ff";
		const result = await compileBrandingDefinition(definition);
		expect(result.ok).toBe(true);
		expect(result.diagnostics).toContainEqual(
			expect.objectContaining({
				code: "BRANDING_CHART_GRID_LOW_CONTRAST",
				severity: "warning",
				path: "modes.light.visualization.grid",
			}),
		);
	});
});

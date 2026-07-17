import { describe, expect, it } from "vitest";
import {
	canonicalJson,
	compileBrandingDefinition,
	sha256,
} from "../../src/index.js";
import {
	getSystemBrandingTemplate,
	resolveSystemBrandingTemplate,
	systemBrandingTemplates,
} from "../../src/system-brandings.js";

describe("immutable SystemBrandingTemplate catalog", () => {
	it("ships fifteen exact, unique, non-placeholder LEMN templates", async () => {
		expect(systemBrandingTemplates).toHaveLength(15);
		expect(
			new Set(
				systemBrandingTemplates.map(
					(template) => `${template.id}@${template.version}`,
				),
			).size,
		).toBe(15);
		expect(Object.isFrozen(systemBrandingTemplates)).toBe(true);
		for (const template of systemBrandingTemplates) {
			expect(template.definitionHash).toMatch(/^(?!0{64}$)[a-f0-9]{64}$/);
			expect(template.definitionHash).toBe(
				await sha256(canonicalJson(template.definition)),
			);
			expect(template.compatibility).toEqual({
				schemaVersion: 1,
				minimumCompilerVersion: "1.0.0",
			});
			expect(template.provenance).toEqual({
				owner: "LEMN",
				license: "LEMN-Original-1.0",
			});
			expect(Object.isFrozen(template)).toBe(true);
			expect(Object.isFrozen(template.definition.modes.light?.colors)).toBe(
				true,
			);
		}
	});

	it.each(
		systemBrandingTemplates.map(
			(template) => [template.id, template.version] as const,
		),
	)("compiles %s@%s in light and dark without blocking diagnostics", async (id, version) => {
		const template = getSystemBrandingTemplate(id, version);
		const result = await compileBrandingDefinition(template.definition);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.artifact.definitionHash).toBe(template.definitionHash);
		expect(Object.keys(result.artifact.modes)).toEqual(["dark", "light"]);
		expect(
			result.diagnostics.filter((entry) => entry.severity === "error"),
		).toEqual([]);
	});

	it("requires exact versions", () => {
		expect(() => getSystemBrandingTemplate("aster-vault", 2)).toThrow(
			"aster-vault@2",
		);
	});

	it("resolves two retained versions of one stable template ID exactly", () => {
		const first = getSystemBrandingTemplate("aster-vault", 1);
		const second = { ...first, version: 2 };
		const catalog = [first, second];
		expect(resolveSystemBrandingTemplate(catalog, "aster-vault", 1)).toBe(
			first,
		);
		expect(resolveSystemBrandingTemplate(catalog, "aster-vault", 2)).toBe(
			second,
		);
	});

	it("allows mutable draft copies without mutating the immutable catalog", () => {
		const template = getSystemBrandingTemplate("verdant-ledger", 1);
		const draftCopy = structuredClone(template.definition);
		const lightMode = draftCopy.modes.light;
		if (!lightMode) throw new Error("verdant-ledger must define light mode");
		lightMode.colors.accent = "#123456";
		expect(template.definition.modes.light?.colors.accent).toBe("#087a55");
	});
});

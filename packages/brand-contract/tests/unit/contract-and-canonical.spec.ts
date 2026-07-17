import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
	BRANDING_COMPILER_VERSION,
	BRANDING_DEFINITION_SCHEMA_URL,
	BRANDING_SCHEMA_VERSION,
	canonicalJson,
	compileBrandingDefinition,
	safeParseBrandingDefinition,
} from "../../src/index.js";
import { makeBrandingDefinition } from "../fixtures/branding-definition.js";

describe("BrandingDefinition v1", () => {
	it("exports the only supported contract identity", () => {
		expect(BRANDING_DEFINITION_SCHEMA_URL).toBe(
			"https://schemas.ui.le-mn.com/branding/v1.json",
		);
		expect(BRANDING_SCHEMA_VERSION).toBe(1);
		expect(BRANDING_COMPILER_VERSION).toBe("1.0.0");
		expect(safeParseBrandingDefinition(makeBrandingDefinition()).success).toBe(
			true,
		);
	});

	it("rejects unknown fields, missing modes, invalid selections, and dangling assets", () => {
		const unknownField = makeBrandingDefinition() as BrandingDefinition & {
			unsupportedFamilies?: unknown;
		};
		unknownField.unsupportedFamilies = {};
		expect(safeParseBrandingDefinition(unknownField).success).toBe(false);

		const missingMode = makeBrandingDefinition();
		missingMode.defaultModeId = "sepia";
		expect(safeParseBrandingDefinition(missingMode).success).toBe(false);

		const forbiddenSelection = makeBrandingDefinition();
		forbiddenSelection.runtimeSelection = {
			selectable: true,
			allowedModeIds: ["light", "sepia"],
		};
		expect(safeParseBrandingDefinition(forbiddenSelection).success).toBe(false);

		const danglingAsset = makeBrandingDefinition();
		danglingAsset.assetRoles = { primaryLogo: "missing-logo" };
		expect(safeParseBrandingDefinition(danglingAsset).success).toBe(false);
	});

	it("rejects every non-JSON extension value at the schema boundary", () => {
		for (const invalid of [
			() => true,
			Symbol("invalid"),
			new Date("2026-07-17T00:00:00Z"),
			Number.NaN,
			Number.POSITIVE_INFINITY,
		]) {
			const definition = makeBrandingDefinition();
			definition.extensions = { "com.lemn.invalid": invalid as never };
			expect(safeParseBrandingDefinition(definition).success).toBe(false);
		}
	});

	it("canonicalizes equivalent object order and compiles the same hashes", async () => {
		const first = makeBrandingDefinition();
		const darkMode = first.modes.dark;
		const lightMode = first.modes.light;
		if (!darkMode || !lightMode) {
			throw new Error("test definition must include light and dark modes");
		}
		const reordered: BrandingDefinition = {
			...first,
			modes: { dark: darkMode, light: lightMode },
			assets: {},
			metadata: {
				externalReferences: first.metadata.externalReferences,
				tags: first.metadata.tags,
				owner: first.metadata.owner,
				description: first.metadata.description,
			},
		};
		expect(canonicalJson(first)).toBe(canonicalJson(reordered));
		const [left, right] = await Promise.all([
			compileBrandingDefinition(first),
			compileBrandingDefinition(reordered),
		]);
		expect(left.ok).toBe(true);
		expect(right.ok).toBe(true);
		if (!left.ok || !right.ok) return;
		expect(left.artifact.definitionHash).toBe(right.artifact.definitionHash);
		expect(left.artifact.compiledHash).toBe(right.artifact.compiledHash);
		expect(left.artifact.fullCss).toBe(right.artifact.fullCss);
	});

	it("keeps the root entrypoint isolated from the System branding catalog", () => {
		const rootEntrypoint = readFileSync(
			new URL("../../src/index.ts", import.meta.url),
			"utf8",
		);
		expect(rootEntrypoint).not.toContain("system-brandings");
	});
});

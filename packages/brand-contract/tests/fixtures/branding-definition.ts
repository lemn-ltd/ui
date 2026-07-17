import type { BrandingDefinition, BrandingMode } from "../../src/index.js";
import { getSystemBrandingTemplate } from "../../src/system-brandings.js";

export function makeBrandingDefinition(
	templateId = "aster-vault",
): BrandingDefinition {
	return structuredClone(getSystemBrandingTemplate(templateId, 1).definition);
}

export function fixtureMode(
	definition: BrandingDefinition,
	modeId: string,
): BrandingMode {
	const mode = definition.modes[modeId];
	if (!mode) throw new Error(`Fixture mode '${modeId}' is missing`);
	return mode;
}

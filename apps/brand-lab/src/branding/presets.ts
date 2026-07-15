import { codexBrandDefinitions } from "./codex-brand-definitions";
import {
	BRAND_PROJECT_SCHEMA_URL,
	type BrandProject,
	parseBrandProject,
} from "./contract";
import { originalBrandDefinitions } from "./original-brand-definitions";
import type {
	BrandPresetDefinition,
	BrandPresetFamily,
} from "./preset-definition";
import { referenceBrandDefinitions } from "./reference-brand-definitions";
import { normalizeBrandColors } from "./theme-color";

const definitions: readonly BrandPresetDefinition[] = Object.freeze([
	...codexBrandDefinitions,
	...originalBrandDefinitions,
	...referenceBrandDefinitions,
]);

const catalog = definitions.map((definition) => buildPreset(definition));

export const brandPresetFamilies: readonly BrandPresetFamily[] = Object.freeze(
	catalog.map(({ family }) => family),
);

export const builtInBrandProjects: readonly BrandProject[] = Object.freeze(
	catalog.flatMap(({ projects }) => projects),
);

export const defaultBrandProject = requireBuiltInProject("codex-github-light");

export function builtInProjectById(
	projectId: string,
): BrandProject | undefined {
	return builtInBrandProjects.find((project) => project.id === projectId);
}

export function brandPresetFamilyById(
	familyId: string,
): BrandPresetFamily | undefined {
	return brandPresetFamilies.find((family) => family.id === familyId);
}

export function brandPresetFamilyByProjectId(
	projectId: string,
): BrandPresetFamily | undefined {
	return brandPresetFamilies.find(
		(family) =>
			family.lightProjectId === projectId || family.darkProjectId === projectId,
	);
}

export function projectIdForPreset(
	familyId: string,
	appearance: BrandProject["appearance"],
): string | undefined {
	const family = brandPresetFamilyById(familyId);
	if (!family) return undefined;
	return appearance === "light" ? family.lightProjectId : family.darkProjectId;
}

function buildPreset(definition: BrandPresetDefinition): {
	readonly family: BrandPresetFamily;
	readonly projects: readonly [BrandProject, BrandProject];
} {
	const familyId = familyIdForDefinition(definition);
	const lightProjectId = `${familyId}-light`;
	const darkProjectId = `${familyId}-dark`;

	return {
		family: Object.freeze({
			id: familyId,
			name: definition.name,
			source: definition.source,
			description: definition.description,
			upstreamThemeId: definition.upstreamThemeId,
			terminalAdaptive: definition.terminalAdaptive ?? false,
			lightProjectId,
			darkProjectId,
		}),
		projects: Object.freeze([
			buildVariant(definition, lightProjectId, "light"),
			buildVariant(definition, darkProjectId, "dark"),
		]) as readonly [BrandProject, BrandProject],
	};
}

function familyIdForDefinition(definition: BrandPresetDefinition): string {
	switch (definition.source) {
		case "codex-open-source":
			return definition.id;
		case "lemn-original":
			return `lemn-${definition.id}`;
		case "visual-reference":
			return `reference-${definition.id}`;
	}
}

function buildVariant(
	definition: BrandPresetDefinition,
	projectId: string,
	appearance: BrandProject["appearance"],
): BrandProject {
	return parseBrandProject({
		$schema: BRAND_PROJECT_SCHEMA_URL,
		schemaVersion: 1,
		id: projectId,
		name: definition.name,
		appearance,
		colors: normalizeBrandColors(definition[appearance], appearance),
		typography: definition.typography,
		shape: definition.shape,
		elevation: definition.elevation,
		density: definition.density,
	});
}

function requireBuiltInProject(projectId: string): BrandProject {
	const project = builtInProjectById(projectId);
	if (!project) {
		throw new Error(`Missing built-in brand project: ${projectId}`);
	}
	return project;
}

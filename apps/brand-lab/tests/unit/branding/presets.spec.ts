import { describe, expect, it } from "vitest";

import { compileBrandProject } from "../../../src/branding/compiler";
import {
	type BrandColorKey,
	type BrandProject,
	brandProjectSchema,
	parseBrandProject,
} from "../../../src/branding/contract";
import {
	brandPresetFamilies,
	brandPresetFamilyById,
	brandPresetFamilyByProjectId,
	builtInBrandProjects,
	builtInProjectById,
	defaultBrandProject,
	projectIdForPreset,
} from "../../../src/branding/presets";
import { contrastRatio } from "../../../src/branding/theme-color";

const CODEX_FAMILY_COUNT = 32;
const LEMN_FAMILY_COUNT = 15;
const REFERENCE_FAMILY_COUNT = 2;
const FAMILY_COUNT =
	CODEX_FAMILY_COUNT + LEMN_FAMILY_COUNT + REFERENCE_FAMILY_COUNT;
const PROJECT_COUNT = FAMILY_COUNT * 2;

describe("built-in brand preset catalog", () => {
	it("contains Codex OSS, LEMN, and visual-reference families with light/dark project pairs", () => {
		const codexFamilies = brandPresetFamilies.filter(
			({ source }) => source === "codex-open-source",
		);
		const lemnFamilies = brandPresetFamilies.filter(
			({ source }) => source === "lemn-original",
		);
		const referenceFamilies = brandPresetFamilies.filter(
			({ source }) => source === "visual-reference",
		);

		expect(brandPresetFamilies).toHaveLength(FAMILY_COUNT);
		expect(codexFamilies).toHaveLength(CODEX_FAMILY_COUNT);
		expect(lemnFamilies).toHaveLength(LEMN_FAMILY_COUNT);
		expect(referenceFamilies).toHaveLength(REFERENCE_FAMILY_COUNT);
		expect(builtInBrandProjects).toHaveLength(PROJECT_COUNT);
		expect(defaultBrandProject.id).toBe("codex-github-light");

		const mappedProjectIds: string[] = [];
		for (const family of brandPresetFamilies) {
			const lightProject = builtInProjectById(family.lightProjectId);
			const darkProject = builtInProjectById(family.darkProjectId);

			expect(
				lightProject,
				`${family.id} must have a light project`,
			).toBeDefined();
			expect(
				darkProject,
				`${family.id} must have a dark project`,
			).toBeDefined();
			expect(lightProject?.appearance).toBe("light");
			expect(darkProject?.appearance).toBe("dark");
			expect(lightProject?.name).toBe(family.name);
			expect(darkProject?.name).toBe(family.name);
			expect(family.lightProjectId).toBe(`${family.id}-light`);
			expect(family.darkProjectId).toBe(`${family.id}-dark`);
			expect(brandPresetFamilyById(family.id)).toBe(family);
			expect(brandPresetFamilyByProjectId(family.lightProjectId)).toBe(family);
			expect(brandPresetFamilyByProjectId(family.darkProjectId)).toBe(family);
			expect(projectIdForPreset(family.id, "light")).toBe(
				family.lightProjectId,
			);
			expect(projectIdForPreset(family.id, "dark")).toBe(family.darkProjectId);

			switch (family.source) {
				case "codex-open-source":
					expect(family.id).toMatch(/^codex-/);
					break;
				case "lemn-original":
					expect(family.id).toMatch(/^lemn-/);
					break;
				case "visual-reference":
					expect(family.id).toMatch(/^reference-/);
					break;
			}

			mappedProjectIds.push(family.lightProjectId, family.darkProjectId);
		}

		expect(mappedProjectIds).toEqual(builtInBrandProjects.map(({ id }) => id));
		expect(brandPresetFamilyById("unknown-family")).toBeUndefined();
		expect(brandPresetFamilyByProjectId("unknown-project")).toBeUndefined();
		expect(projectIdForPreset("unknown-family", "light")).toBeUndefined();
	});

	it("validates and compiles all 98 projects with unique ids and hashes", () => {
		const ids = new Set<string>();
		const hashes = new Set<string>();

		for (const project of builtInBrandProjects) {
			const parsed = brandProjectSchema.safeParse(project);
			expect(parsed.success, `${project.id} must match schema v1`).toBe(true);
			expect(parseBrandProject(project)).toEqual(project);

			const snapshot = compileBrandProject(project);
			expect(snapshot.projectId).toBe(project.id);
			expect(snapshot.projectName).toBe(project.name);
			expect(snapshot.appearance).toBe(project.appearance);
			expect(snapshot.hash).toMatch(/^[0-9a-f]{8}$/);
			expect(snapshot.version).toBe(`v1-${snapshot.hash}`);
			expect(snapshot.cssText).toContain(
				`:root[data-brand-hash="${snapshot.hash}"]`,
			);
			expect(snapshot.cssText).toContain(`color-scheme: ${project.appearance}`);
			expect(snapshot.chartTheme.color).toEqual([
				project.colors.chartPrimary,
				project.colors.chartSecondary,
				project.colors.chartTertiary,
			]);

			ids.add(project.id);
			hashes.add(snapshot.hash);
		}

		expect(ids.size).toBe(PROJECT_COUNT);
		expect(hashes.size).toBe(PROJECT_COUNT);
	});

	it("captures the distinguishing Cloudflare and Apple visual contracts", () => {
		const cloudflareLight = builtInProjectById(
			"reference-cloudflare-dashboard-light",
		);
		const cloudflareDark = builtInProjectById(
			"reference-cloudflare-dashboard-dark",
		);
		const appleLight = builtInProjectById("reference-apple-system-light");
		const appleDark = builtInProjectById("reference-apple-system-dark");

		expect(cloudflareLight).toMatchObject({
			name: "Cloudflare Dashboard",
			appearance: "light",
			density: "compact",
			elevation: "subtle",
			shape: { controlRadius: 8, cardRadius: 8, borderWidth: 1 },
			colors: { background: "#FBFBFB", accent: "#056DFF" },
		});
		expect(cloudflareDark).toMatchObject({
			appearance: "dark",
			colors: {
				background: "#030303",
				surface: "#0F0F0F",
				chartTertiary: "#E8649D",
			},
		});
		expect(appleLight).toMatchObject({
			name: "Apple",
			appearance: "light",
			density: "spacious",
			elevation: "strong",
			typography: {
				bodyFamily: "apple-system",
				headingFamily: "apple-system",
				baseSize: 17,
				headingWeight: 600,
			},
			shape: { controlRadius: 20, cardRadius: 20, borderWidth: 1 },
			colors: { background: "#F5F5F7", accent: "#0071E3" },
		});
		expect(appleDark).toMatchObject({
			appearance: "dark",
			colors: {
				background: "#000000",
				surface: "#1C1C1E",
				accent: "#0091FF",
			},
		});
	});

	it("meets the required text, focus, and chart contrast for every project", () => {
		const requirements: readonly {
			foreground: BrandColorKey;
			background: BrandColorKey;
			minimum: number;
		}[] = [
			{ foreground: "text", background: "background", minimum: 4.5 },
			{ foreground: "text", background: "surface", minimum: 4.5 },
			{ foreground: "textMuted", background: "background", minimum: 4.5 },
			{ foreground: "textMuted", background: "surface", minimum: 4.5 },
			{ foreground: "accentForeground", background: "accent", minimum: 4.5 },
			{ foreground: "focus", background: "background", minimum: 3 },
			{ foreground: "chartPrimary", background: "surface", minimum: 3 },
			{ foreground: "chartSecondary", background: "surface", minimum: 3 },
			{ foreground: "chartTertiary", background: "surface", minimum: 3 },
		];
		const failures: string[] = [];

		for (const project of builtInBrandProjects) {
			for (const requirement of requirements) {
				const failure = contrastFailure(project, requirement);
				if (failure) failures.push(failure);
			}
		}

		expect(failures).toEqual([]);
	});
});

function contrastFailure(
	project: BrandProject,
	requirement: {
		readonly foreground: BrandColorKey;
		readonly background: BrandColorKey;
		readonly minimum: number;
	},
): string | null {
	const { foreground, background, minimum } = requirement;
	const ratio = contrastRatio(
		project.colors[foreground],
		project.colors[background],
	);
	if (ratio >= minimum) return null;
	return `${project.id}: ${foreground}/${background} is ${ratio.toFixed(2)}, expected >= ${minimum}`;
}

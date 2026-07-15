import { describe, expect, it } from "vitest";

import {
	brandFontCatalog,
	compileBrandProject,
} from "../../../src/branding/compiler";
import {
	builtInBrandProjects,
	defaultBrandProject,
} from "../../../src/branding/presets";

const expectedTokenNames = [
	"--brand-background",
	"--brand-surface",
	"--brand-surface-muted",
	"--brand-text",
	"--brand-text-muted",
	"--brand-accent",
	"--brand-accent-foreground",
	"--brand-border",
	"--brand-focus",
	"--brand-chart-primary",
	"--brand-chart-secondary",
	"--brand-chart-tertiary",
	"--brand-font-body",
	"--brand-font-heading",
	"--brand-font-size",
	"--brand-heading-weight",
	"--brand-control-radius",
	"--brand-card-radius",
	"--brand-border-width",
	"--brand-shadow-card",
	"--brand-control-height",
	"--brand-space-scale",
] as const;

describe("compileBrandProject", () => {
	it("compiles the complete project contract into one deterministic branded snapshot", () => {
		const first = compileBrandProject(defaultBrandProject);
		const second = compileBrandProject(structuredClone(defaultBrandProject));
		const bodyFont = brandFontCatalog.find(
			({ id }) => id === defaultBrandProject.typography.bodyFamily,
		);

		expect(second).toEqual(first);
		expect(first.hash).toMatch(/^[0-9a-f]{8}$/);
		expect(first.version).toBe(`v1-${first.hash}`);
		expect(first.projectId).toBe(defaultBrandProject.id);
		expect(first.projectName).toBe(defaultBrandProject.name);
		expect(first.appearance).toBe(defaultBrandProject.appearance);
		expect(Object.keys(first.tokens)).toEqual(expectedTokenNames);
		expect(first.tokens).toMatchObject({
			"--brand-background": defaultBrandProject.colors.background,
			"--brand-surface": defaultBrandProject.colors.surface,
			"--brand-text": defaultBrandProject.colors.text,
			"--brand-accent": defaultBrandProject.colors.accent,
			"--brand-accent-foreground": defaultBrandProject.colors.accentForeground,
			"--brand-border": defaultBrandProject.colors.border,
			"--brand-focus": defaultBrandProject.colors.focus,
			"--brand-font-body": bodyFont?.stack,
			"--brand-font-size": `${defaultBrandProject.typography.baseSize}px`,
			"--brand-heading-weight": String(
				defaultBrandProject.typography.headingWeight,
			),
			"--brand-control-radius": `${defaultBrandProject.shape.controlRadius}px`,
			"--brand-card-radius": `${defaultBrandProject.shape.cardRadius}px`,
			"--brand-border-width": `${defaultBrandProject.shape.borderWidth}px`,
			"--brand-control-height": "40px",
			"--brand-space-scale": "1",
		});

		expect(first.cssText).toMatch(
			new RegExp(`^:root\\[data-brand-hash="${first.hash}"\\] \\{`),
		);
		for (const [name, value] of Object.entries(first.tokens)) {
			expect(first.cssText).toContain(`  ${name}: ${value};`);
		}
		expect(first.cssText).toContain(
			`  color-scheme: ${defaultBrandProject.appearance};`,
		);
	});

	it("projects every configured chart color and surface into the renderer theme", () => {
		const project = builtInBrandProjects.find(
			(candidate) => candidate.id === "codex-github-dark",
		);
		if (!project) throw new Error("Missing Codex GitHub dark project fixture");
		const snapshot = compileBrandProject(project);
		const bodyFont = brandFontCatalog.find(
			({ id }) => id === project.typography.bodyFamily,
		);

		expect(snapshot.chartTheme.color).toEqual([
			project.colors.chartPrimary,
			project.colors.chartSecondary,
			project.colors.chartTertiary,
		]);
		expect(snapshot.chartTheme.backgroundColor).toBe("transparent");
		expect(snapshot.chartTheme.textStyle).toEqual({
			color: project.colors.text,
			fontFamily: bodyFont?.stack,
		});
		expect(snapshot.chartTheme.legend).toEqual({
			textStyle: {
				color: project.colors.textMuted,
				fontFamily: bodyFont?.stack,
			},
		});
		expect(snapshot.chartTheme.categoryAxis).toMatchObject({
			axisLine: { lineStyle: { color: project.colors.border } },
			axisLabel: {
				color: project.colors.textMuted,
				fontFamily: bodyFont?.stack,
			},
		});
		expect(snapshot.chartTheme.valueAxis).toEqual(
			snapshot.chartTheme.categoryAxis,
		);
		expect(snapshot.chartTheme.tooltip).toMatchObject({
			backgroundColor: project.colors.surface,
			borderColor: project.colors.border,
			borderWidth: project.shape.borderWidth,
			textStyle: { color: project.colors.text, fontFamily: bodyFont?.stack },
		});
	});

	it("produces a new atomic version when any branding input changes", () => {
		const original = compileBrandProject(defaultBrandProject);
		const changedProject = structuredClone(defaultBrandProject);
		changedProject.colors.accent = "#123456";
		const changed = compileBrandProject(changedProject);

		expect(changed.hash).not.toBe(original.hash);
		expect(changed.version).not.toBe(original.version);
		expect(changed.tokens["--brand-accent"]).toBe("#123456");
		expect(changed.cssText).toContain("--brand-accent: #123456;");
		expect(changed.cssText).not.toContain(`data-brand-hash="${original.hash}"`);
	});

	it("rejects malformed or extended contracts before generating CSS", () => {
		const invalidColor = structuredClone(defaultBrandProject);
		invalidColor.colors.accent = "red";

		const extendedContract = {
			...structuredClone(defaultBrandProject),
			unversionedExtension: true,
		};

		expect(() => compileBrandProject(invalidColor)).toThrow(
			"Use a six-digit hexadecimal color",
		);
		expect(() => compileBrandProject(extendedContract)).toThrow();
	});
});

import {
	type BrandFontFamily,
	type BrandProject,
	parseBrandProject,
} from "./contract";

const FONT_STACKS: Readonly<Record<BrandFontFamily, string>> = {
	"system-sans":
		'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	"apple-system":
		'-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
	humanist:
		'Optima, Candara, "Noto Sans", "Helvetica Neue", ui-sans-serif, system-ui, sans-serif',
	editorial: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif',
	mono: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
};

const SHADOWS = {
	none: "none",
	subtle: "0 12px 34px rgb(15 23 42 / 0.10)",
	strong: "0 24px 64px rgb(15 23 42 / 0.24)",
} as const;

const DENSITY = {
	compact: { controlHeight: 34, space: 0.82 },
	comfortable: { controlHeight: 40, space: 1 },
	spacious: { controlHeight: 46, space: 1.18 },
} as const;

export interface BrandChartTheme {
	readonly color: readonly string[];
	readonly backgroundColor: string;
	readonly textStyle: Readonly<Record<string, unknown>>;
	readonly legend: Readonly<Record<string, unknown>>;
	readonly categoryAxis: Readonly<Record<string, unknown>>;
	readonly valueAxis: Readonly<Record<string, unknown>>;
	readonly tooltip: Readonly<Record<string, unknown>>;
}

export interface CompiledBrandSnapshot {
	readonly schemaVersion: 1;
	readonly projectId: string;
	readonly projectName: string;
	readonly appearance: BrandProject["appearance"];
	readonly hash: string;
	readonly version: string;
	readonly tokens: Readonly<Record<string, string>>;
	readonly cssText: string;
	readonly chartTheme: BrandChartTheme;
}

export const brandFontCatalog = Object.freeze(
	Object.entries(FONT_STACKS).map(([id, stack]) => ({
		id: id as BrandFontFamily,
		stack,
	})),
);

export function compileBrandProject(input: unknown): CompiledBrandSnapshot {
	const project = parseBrandProject(input);
	const hash = stableHash(JSON.stringify(project));
	const density = DENSITY[project.density];
	const bodyFont = FONT_STACKS[project.typography.bodyFamily];
	const headingFont = FONT_STACKS[project.typography.headingFamily];

	const tokens = Object.freeze({
		"--brand-background": project.colors.background,
		"--brand-surface": project.colors.surface,
		"--brand-surface-muted": project.colors.surfaceMuted,
		"--brand-text": project.colors.text,
		"--brand-text-muted": project.colors.textMuted,
		"--brand-accent": project.colors.accent,
		"--brand-accent-foreground": project.colors.accentForeground,
		"--brand-border": project.colors.border,
		"--brand-focus": project.colors.focus,
		"--brand-chart-primary": project.colors.chartPrimary,
		"--brand-chart-secondary": project.colors.chartSecondary,
		"--brand-chart-tertiary": project.colors.chartTertiary,
		"--brand-font-body": bodyFont,
		"--brand-font-heading": headingFont,
		"--brand-font-size": `${project.typography.baseSize}px`,
		"--brand-heading-weight": String(project.typography.headingWeight),
		"--brand-control-radius": `${project.shape.controlRadius}px`,
		"--brand-card-radius": `${project.shape.cardRadius}px`,
		"--brand-border-width": `${project.shape.borderWidth}px`,
		"--brand-shadow-card": SHADOWS[project.elevation],
		"--brand-control-height": `${density.controlHeight}px`,
		"--brand-space-scale": String(density.space),
	});

	const tokenLines = Object.entries(tokens).map(
		([name, value]) => `  ${name}: ${value};`,
	);
	const cssText = [
		`:root[data-brand-hash="${hash}"] {`,
		...tokenLines,
		`  color-scheme: ${project.appearance};`,
		"}",
	].join("\n");

	const axis = {
		axisLine: { lineStyle: { color: project.colors.border } },
		axisTick: { lineStyle: { color: project.colors.border } },
		axisLabel: { color: project.colors.textMuted, fontFamily: bodyFont },
		splitLine: { lineStyle: { color: project.colors.border, opacity: 0.58 } },
		nameTextStyle: { color: project.colors.textMuted, fontFamily: bodyFont },
	};

	return Object.freeze({
		schemaVersion: 1,
		projectId: project.id,
		projectName: project.name,
		appearance: project.appearance,
		hash,
		version: `v1-${hash}`,
		tokens,
		cssText,
		chartTheme: Object.freeze({
			color: Object.freeze([
				project.colors.chartPrimary,
				project.colors.chartSecondary,
				project.colors.chartTertiary,
			]),
			backgroundColor: "transparent",
			textStyle: { color: project.colors.text, fontFamily: bodyFont },
			legend: {
				textStyle: { color: project.colors.textMuted, fontFamily: bodyFont },
			},
			categoryAxis: axis,
			valueAxis: axis,
			tooltip: {
				backgroundColor: project.colors.surface,
				borderColor: project.colors.border,
				borderWidth: project.shape.borderWidth,
				textStyle: { color: project.colors.text, fontFamily: bodyFont },
				extraCssText: `border-radius:${project.shape.controlRadius}px;box-shadow:${SHADOWS[project.elevation]}`,
			},
		}),
	});
}

export function applyBrandSnapshotToDocument(
	snapshot: CompiledBrandSnapshot,
): void {
	const style = document.getElementById("brand-project-styles");
	if (!(style instanceof HTMLStyleElement)) {
		throw new Error("Missing server-rendered brand style element");
	}

	style.textContent = snapshot.cssText;
	document.documentElement.dataset.brandId = snapshot.projectId;
	document.documentElement.dataset.brandHash = snapshot.hash;
	document.documentElement.dataset.brandVersion = snapshot.version;
	document.documentElement.dataset.brandAppearance = snapshot.appearance;
}

function stableHash(value: string): string {
	let hash = 0x811c9dc5;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193);
	}
	return (hash >>> 0).toString(16).padStart(8, "0");
}

import { bestContrastingColor } from "./color.js";
import {
	BRANDING_COMPILER_VERSION,
	BRANDING_DEFINITION_SCHEMA_URL,
	BRANDING_SCHEMA_VERSION,
	type BrandingDefinition,
	type BrandingMode,
	type BrandingTypography,
	parseBrandingDefinition,
} from "./contract.js";
import { FONT_CATALOG_VERSION } from "./font-catalog.js";

export type SystemBrandingCategory =
	| "neutral"
	| "operational"
	| "data"
	| "editorial"
	| "creative";

export type SystemBrandingTemplate = {
	readonly id: string;
	readonly version: number;
	readonly name: string;
	readonly description: string;
	readonly category: SystemBrandingCategory;
	readonly tags: readonly string[];
	readonly status: "available" | "deprecated";
	readonly definition: BrandingDefinition;
	readonly definitionHash: string;
	readonly compatibility: {
		readonly schemaVersion: typeof BRANDING_SCHEMA_VERSION;
		readonly minimumCompilerVersion: string;
	};
	readonly provenance: {
		readonly owner: "LEMN";
		readonly license: string;
	};
};

type TemplateSource = {
	readonly id: string;
	readonly version: number;
	readonly name: string;
	readonly description: string;
	readonly category: SystemBrandingCategory;
	readonly light: {
		readonly canvas: string;
		readonly muted: string;
		readonly accent: string;
	};
	readonly dark: {
		readonly canvas: string;
		readonly surface: string;
		readonly accent: string;
	};
	readonly radius: number;
	readonly density: "compact" | "comfortable" | "spacious";
	readonly heading: "inherit-body" | "system-serif";
};

const sources: readonly TemplateSource[] = [
	source(
		"aster-vault",
		1,
		"Aster Vault",
		"Quiet indigo structure with emerald data signals.",
		"operational",
		"#f5f6ff",
		"#eceefe",
		"#4f46c8",
		"#090a14",
		"#121426",
		"#9b95ff",
		12,
	),
	source(
		"verdant-ledger",
		1,
		"Verdant Ledger",
		"Measured botanical greens for operational products.",
		"data",
		"#f3f8f5",
		"#e7f1eb",
		"#087a55",
		"#07110d",
		"#0f1b15",
		"#55d6a2",
		14,
	),
	source(
		"ember-studio",
		1,
		"Ember Studio",
		"Warm editorial surfaces with analytical restraint.",
		"editorial",
		"#fff7f2",
		"#fcebe0",
		"#b94812",
		"#150b07",
		"#21120c",
		"#ff8a4c",
		10,
		"comfortable",
		"system-serif",
	),
	source(
		"tideglass",
		1,
		"Tideglass",
		"Airy cyan surfaces with ocean-blue focus.",
		"creative",
		"#f2fafc",
		"#e3f4f7",
		"#006f8e",
		"#061216",
		"#0d1d22",
		"#4dd4f2",
		16,
		"spacious",
	),
	source(
		"orchid-signal",
		1,
		"Orchid Signal",
		"Expressive orchid identity with calm neutral surfaces.",
		"creative",
		"#fdf7ff",
		"#f6e8fb",
		"#7e22ce",
		"#120717",
		"#201027",
		"#d8b4fe",
		14,
		"comfortable",
		"system-serif",
	),
	source(
		"cobalt-transit",
		1,
		"Cobalt Transit",
		"Direct blue hierarchy for fast operational workflows.",
		"operational",
		"#f5f8ff",
		"#e7efff",
		"#1d4ed8",
		"#070d1d",
		"#101a31",
		"#93c5fd",
		8,
		"compact",
	),
	source(
		"saffron-field",
		1,
		"Saffron Field",
		"Earthy gold and ink for human-centered tools.",
		"editorial",
		"#fffbeb",
		"#fef3c7",
		"#92400e",
		"#171006",
		"#251a09",
		"#fbbf24",
		12,
		"comfortable",
		"system-serif",
	),
	source(
		"rosewood-notes",
		1,
		"Rosewood Notes",
		"A composed rose palette for editorial products.",
		"editorial",
		"#fff7f8",
		"#ffe4e9",
		"#9f1239",
		"#18080d",
		"#281018",
		"#fda4af",
		10,
		"comfortable",
		"system-serif",
	),
	source(
		"alpine-console",
		1,
		"Alpine Console",
		"Crisp forest tones for dependable system surfaces.",
		"operational",
		"#f4faf6",
		"#e5f5ea",
		"#166534",
		"#07120b",
		"#101f15",
		"#86efac",
		8,
		"compact",
	),
	source(
		"slate-bureau",
		1,
		"Slate Bureau",
		"Neutral slate for dense administrative products.",
		"neutral",
		"#f8fafc",
		"#e2e8f0",
		"#334155",
		"#070b12",
		"#111827",
		"#cbd5e1",
		6,
		"compact",
	),
	source(
		"copper-pulse",
		1,
		"Copper Pulse",
		"Confident copper accents on quiet warm surfaces.",
		"operational",
		"#fff8f3",
		"#ffeadc",
		"#9a3412",
		"#160b06",
		"#26130c",
		"#fdba74",
		12,
	),
	source(
		"iris-grid",
		1,
		"Iris Grid",
		"Structured violet for data-rich creative systems.",
		"data",
		"#faf7ff",
		"#efe7ff",
		"#6d28d9",
		"#0e0718",
		"#1b102c",
		"#c4b5fd",
		14,
	),
	source(
		"lagoon-index",
		1,
		"Lagoon Index",
		"Balanced teal for reporting and service products.",
		"data",
		"#f2fbfa",
		"#dff6f2",
		"#0f766e",
		"#061413",
		"#0d2421",
		"#5eead4",
		12,
	),
	source(
		"night-bloom",
		1,
		"Night Bloom",
		"Magenta energy contained by editorial neutrals.",
		"creative",
		"#fff7fe",
		"#f9e6f7",
		"#86198f",
		"#150817",
		"#241027",
		"#f0abfc",
		16,
		"spacious",
		"system-serif",
	),
	source(
		"solar-ink",
		1,
		"Solar Ink",
		"A bright ochre signal paired with precise ink surfaces.",
		"editorial",
		"#fffceb",
		"#fef5bd",
		"#854d0e",
		"#151104",
		"#24200c",
		"#fde047",
		10,
		"comfortable",
		"system-serif",
	),
];

const definitionHashes: Readonly<Record<string, string>> = Object.freeze({
	"aster-vault@1":
		"09b1c298a67d6c598e055f9b09ea62a1d5024720698d4fd0a2ae818041c4d3e9",
	"verdant-ledger@1":
		"a3b38f7f997bd42bf9315a48b02bea79c526d35f8ae0cd3c78107c36e06e5819",
	"ember-studio@1":
		"552bc99d5b0f8f4c86b4192a1a3955da4bfccdc0ea6579cd6775b5ba651cbb47",
	"tideglass@1":
		"2a3357a123ec7dfb6720436c61aec2472cbf0669fe6ad1d73b00f22b4048da60",
	"orchid-signal@1":
		"738b1ae29d9c0b682a6c6fdbdf67b1f901cf36c0439ce864094e932cd61a17f4",
	"cobalt-transit@1":
		"c2d3a3788ccb958f496e1089c46f216eacdd0e33c6cecd8b26fbd36c171de895",
	"saffron-field@1":
		"6ba18583773f19baf1a53bcd231060233e3c2db9de45c289e20c0fc2483758a6",
	"rosewood-notes@1":
		"22b6a96dfe3b5fb7b8293634dfb21666d0232834c4420a8f1d67aa833bfe5675",
	"alpine-console@1":
		"e5878a3a577398dfd29310d542cd20f9cf70ad69dccb1ca27a5b2646e7f8e5bc",
	"slate-bureau@1":
		"ced0167f0b14d308827f622a6b8e1a2ce0e52e8c540d83416aca1fcaa3e8c519",
	"copper-pulse@1":
		"36228261b422c4ecc07e4dc3dd32323a1f82b4820f1c8a47c73efa17d00906bb",
	"iris-grid@1":
		"4c41ddb9bae65693fc10a237d214c43344beb4f957bfaecf740b5774bb97ca1e",
	"lagoon-index@1":
		"1fe7b28440f722dd36ecc6344810d2cd4beca392f55bad1ad3e1b471155ca330",
	"night-bloom@1":
		"dfc8899bdb6c00cde4adf6300fce5755f7fe7e87fdcfaced6c9ed492b8cae4ae",
	"solar-ink@1":
		"4aa1baf23d3ca268bb810a6399a20583314207196ec57a3ae39b4b2b832f336a",
});

export const systemBrandingTemplates: readonly SystemBrandingTemplate[] =
	deepFreeze(
		sources.map((template) => ({
			id: template.id,
			version: template.version,
			name: template.name,
			description: template.description,
			category: template.category,
			tags: ["lemn-original", template.category],
			status: "available" as const,
			definition: createDefinition(template),
			definitionHash: requiredDefinitionHash(template.id, template.version),
			compatibility: {
				schemaVersion: BRANDING_SCHEMA_VERSION,
				minimumCompilerVersion: BRANDING_COMPILER_VERSION,
			},
			provenance: {
				owner: "LEMN" as const,
				license: "LEMN-Original-1.0",
			},
		})),
	);

export function getSystemBrandingTemplate(
	id: string,
	version: number,
): SystemBrandingTemplate {
	return resolveSystemBrandingTemplate(systemBrandingTemplates, id, version);
}

export function resolveSystemBrandingTemplate(
	catalog: readonly SystemBrandingTemplate[],
	id: string,
	version: number,
): SystemBrandingTemplate {
	const template = catalog.find(
		(entry) => entry.id === id && entry.version === version,
	);
	if (!template) throw new Error(`Unknown system branding: ${id}@${version}`);
	return template;
}

function requiredDefinitionHash(id: string, version: number): string {
	const exactReference = `${id}@${version}`;
	const value = definitionHashes[exactReference];
	if (!value)
		throw new Error(
			`Missing immutable definition hash for system branding '${exactReference}'`,
		);
	return value;
}

function createDefinition(template: TemplateSource): BrandingDefinition {
	return parseBrandingDefinition({
		$schema: BRANDING_DEFINITION_SCHEMA_URL,
		schemaVersion: BRANDING_SCHEMA_VERSION,
		name: template.name,
		metadata: {
			description: template.description,
			tags: ["lemn-original", template.category],
			owner: "LEMN",
			externalReferences: {},
		},
		assets: {},
		typography: createTypography(template),
		defaultModeId: "light",
		modes: {
			light: createMode(template, "light"),
			dark: createMode(template, "dark"),
		},
		runtimeSelection: { selectable: true, allowedModeIds: ["light", "dark"] },
	});
}

function source(
	id: string,
	version: number,
	name: string,
	description: string,
	category: SystemBrandingCategory,
	lightCanvas: string,
	lightMuted: string,
	lightAccent: string,
	darkCanvas: string,
	darkSurface: string,
	darkAccent: string,
	radius: number,
	density: TemplateSource["density"] = "comfortable",
	heading: TemplateSource["heading"] = "inherit-body",
): TemplateSource {
	return {
		id,
		version,
		name,
		description,
		category,
		light: { canvas: lightCanvas, muted: lightMuted, accent: lightAccent },
		dark: { canvas: darkCanvas, surface: darkSurface, accent: darkAccent },
		radius,
		density,
		heading,
	};
}

function createMode(
	template: TemplateSource,
	colorScheme: "light" | "dark",
): BrandingMode {
	const dark = colorScheme === "dark";
	const accent = dark ? template.dark.accent : template.light.accent;
	const canvas = dark ? template.dark.canvas : template.light.canvas;
	const surface = dark ? template.dark.surface : "#ffffff";
	const surfaceMuted = dark
		? mixSurface(template.dark.surface, "#ffffff", 0.08)
		: template.light.muted;
	const radius = `${template.radius}px`;
	return {
		colorScheme,
		colors: {
			canvas,
			surface,
			surfaceMuted,
			surfaceElevated: dark ? mixSurface(surface, "#ffffff", 0.05) : "#ffffff",
			surfaceOverlay: surface,
			text: dark ? "#f8fafc" : "#0f172a",
			textMuted: dark ? "#cbd5e1" : "#475569",
			textInverse: dark ? "#0f172a" : "#ffffff",
			accent,
			accentForeground: bestContrastingColor(accent),
			border: dark ? "#334155" : "#cbd5e1",
			borderStrong: dark ? "#94a3b8" : "#64748b",
			focus: accent,
			selection: dark ? "#334155" : template.light.muted,
			disabledSurface: surfaceMuted,
			disabledText: dark ? "#94a3b8" : "#64748b",
			success: dark
				? { surface: "#052e16", foreground: "#bbf7d0", border: "#22c55e" }
				: { surface: "#dcfce7", foreground: "#14532d", border: "#15803d" },
			warning: dark
				? { surface: "#451a03", foreground: "#fef3c7", border: "#f59e0b" }
				: { surface: "#fef3c7", foreground: "#78350f", border: "#b45309" },
			danger: dark
				? { surface: "#450a0a", foreground: "#fecaca", border: "#ef4444" }
				: { surface: "#fee2e2", foreground: "#7f1d1d", border: "#b91c1c" },
			info: dark
				? { surface: "#172554", foreground: "#dbeafe", border: "#3b82f6" }
				: { surface: "#dbeafe", foreground: "#1e3a8a", border: "#1d4ed8" },
		},
		shape: {
			borderWidth: "1px",
			borderStyle: "solid",
			radiusSmall: `${Math.max(2, template.radius - 6)}px`,
			radiusMedium: `${Math.max(4, template.radius - 2)}px`,
			radiusLarge: `${template.radius + 6}px`,
			radiusControl: radius,
			radiusCard: `${template.radius + 4}px`,
			radiusPill: "999px",
			outlineTreatment: "outside",
		},
		elevation: {
			raised: dark
				? "0 1px 2px rgb(0 0 0 / 0.45)"
				: "0 1px 3px rgb(15 23 42 / 0.1)",
			overlay: dark
				? "0 12px 30px rgb(0 0 0 / 0.65)"
				: "0 12px 30px rgb(15 23 42 / 0.16)",
			modal: dark
				? "0 24px 60px rgb(0 0 0 / 0.75)"
				: "0 24px 60px rgb(15 23 42 / 0.22)",
			focusRingWidth: "2px",
			focusRingOffset: "2px",
		},
		spacingAndDensity: {
			density: template.density,
			scale:
				template.density === "compact"
					? 0.9
					: template.density === "spacious"
						? 1.12
						: 1,
			controlHeight:
				template.density === "compact"
					? "36px"
					: template.density === "spacious"
						? "46px"
						: "40px",
			contentGutter:
				template.density === "compact"
					? "18px"
					: template.density === "spacious"
						? "32px"
						: "24px",
		},
		motion: {
			durationFast: "100ms",
			durationNormal: "180ms",
			durationSlow: "300ms",
			easingStandard: "cubic-bezier(0.2, 0, 0, 1)",
			easingEmphasized: "cubic-bezier(0.2, 0, 0, 1)",
			decorativeMotion: true,
			reducedMotion: "reduce",
		},
		visualization: {
			categorical: [
				accent,
				"#0f766e",
				"#b45309",
				"#7e22ce",
				"#be123c",
				"#0369a1",
			],
			sequential: [
				dark ? "#1e293b" : "#e2e8f0",
				accent,
				dark ? "#f8fafc" : "#0f172a",
			],
			diverging: ["#b91c1c", dark ? "#475569" : "#e2e8f0", "#1d4ed8"],
			positive: "#16a34a",
			negative: "#dc2626",
			neutral: dark ? "#94a3b8" : "#64748b",
			axis: dark ? "#cbd5e1" : "#475569",
			grid: dark ? "#334155" : "#cbd5e1",
			label: dark ? "#e2e8f0" : "#334155",
			tooltipSurface: "#0f172a",
			tooltipBorder: dark ? "#64748b" : "#334155",
			tooltipText: "#ffffff",
			cursor: accent,
			crosshair: accent,
			selection: dark ? "#334155" : template.light.muted,
			mutedOpacity: 0.55,
			inactiveOpacity: 0.25,
		},
		iconography: {
			family: "Lucide",
			style: "outline",
			strokeWidth: 2,
			defaultSize: "20px",
		},
		accessibility: {
			standard: "WCAG-2.2-AA",
			normalTextContrast: 4.5,
			largeTextContrast: 3,
			nonTextContrast: 3,
			minimumTargetSize: 44,
			forceVisibleFocus: true,
			forcedColors: "system",
			automaticCorrections: "derived-only",
		},
		componentAppearance: {
			controls: "solid",
			cards: "bordered",
			inputs: "outlined",
		},
	};
}

function createTypography(template: TemplateSource): BrandingTypography {
	return {
		catalogVersion: FONT_CATALOG_VERSION,
		body: {
			source: "system",
			ref: "system.ui",
			fidelity: "preferred",
			emergencyFallbackRef: "system.sans",
			weights: [400, 500, 600],
			styles: ["normal"],
		},
		heading:
			template.heading === "system-serif"
				? {
						source: "system",
						ref: "system.serif",
						fidelity: "preferred",
						emergencyFallbackRef: "system.ui",
						weights: [400, 600, 700],
						styles: ["normal"],
					}
				: { source: "inherit", role: "body" },
		code: {
			source: "system",
			ref: "system.mono",
			fidelity: "preferred",
			emergencyFallbackRef: "system.ui",
			weights: [400, 600],
			styles: ["normal"],
		},
		label: { source: "inherit", role: "body" },
		baseSize: 16,
		displaySize: 52,
		titleSize: 30,
		bodyLineHeight: 1.5,
		headingLineHeight: 1.1,
		tracking: 0,
	};
}

function mixSurface(first: string, second: string, weight: number): string {
	const parse = (value: string): number[] =>
		[1, 3, 5].map((start) =>
			Number.parseInt(value.slice(start, start + 2), 16),
		);
	const left = parse(first);
	const right = parse(second);
	return `#${left
		.map((value, index) =>
			Math.round(value * (1 - weight) + (right[index] ?? value) * weight)
				.toString(16)
				.padStart(2, "0"),
		)
		.join("")}`;
}

function deepFreeze<T>(value: T): T {
	if (value === null || typeof value !== "object") return value;
	for (const child of Object.values(value as Record<string, unknown>))
		deepFreeze(child);
	return Object.freeze(value);
}

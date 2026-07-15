import type { BrandProject } from "./contract";
import type { BrandPresetDefinition } from "./preset-definition";

type BrandColors = BrandProject["colors"];

function palette(
	background: string,
	surface: string,
	surfaceMuted: string,
	text: string,
	textMuted: string,
	accent: string,
	accentForeground: string,
	border: string,
	focus: string,
	chartPrimary: string,
	chartSecondary: string,
	chartTertiary: string,
): BrandColors {
	return {
		background,
		surface,
		surfaceMuted,
		text,
		textMuted,
		accent,
		accentForeground,
		border,
		focus,
		chartPrimary,
		chartSecondary,
		chartTertiary,
	};
}

/**
 * Public-product visual studies expressed only through the Brand Project
 * contract. No third-party component source, logo, font file, or asset is
 * copied; provider behavior remains owned by the selected upstream packages.
 */
export const referenceBrandDefinitions: readonly BrandPresetDefinition[] = [
	{
		id: "cloudflare-dashboard",
		name: "Cloudflare Dashboard",
		source: "visual-reference",
		description:
			"A public-product study based on Cloudflare Kumo 2.7 semantic colors and compact dashboard geometry, without copying product components or assets.",
		typography: {
			bodyFamily: "system-sans",
			headingFamily: "system-sans",
			baseSize: 14,
			headingWeight: 600,
		},
		shape: { controlRadius: 8, cardRadius: 8, borderWidth: 1 },
		elevation: "subtle",
		density: "compact",
		light: palette(
			"#FBFBFB",
			"#FFFFFF",
			"#F2F2F2",
			"#18181B",
			"#737373",
			"#056DFF",
			"#FFFFFF",
			"#E9E9E9",
			"#0B0B0B",
			"#4290F0",
			"#F5B647",
			"#E8649D",
		),
		dark: palette(
			"#030303",
			"#0F0F0F",
			"#0B0B0B",
			"#F5F5F5",
			"#A1A1A1",
			"#045EDE",
			"#FFFFFF",
			"#262626",
			"#E9E9E9",
			"#4290F0",
			"#EEB720",
			"#E8649D",
		),
	},
	{
		id: "apple-system",
		name: "Apple",
		source: "visual-reference",
		description:
			"A public-product study of Apple's application language: semantic system colors, generous spacing, rounded materials, and soft depth in coordinated light and dark appearances.",
		typography: {
			bodyFamily: "apple-system",
			headingFamily: "apple-system",
			baseSize: 17,
			headingWeight: 600,
		},
		shape: { controlRadius: 20, cardRadius: 20, borderWidth: 1 },
		elevation: "strong",
		density: "spacious",
		light: palette(
			"#F5F5F7",
			"#FFFFFF",
			"#F2F2F7",
			"#1D1D1F",
			"#6E6E73",
			"#0071E3",
			"#FFFFFF",
			"#D2D2D7",
			"#0071E3",
			"#0088FF",
			"#34C759",
			"#FF8D28",
		),
		dark: palette(
			"#000000",
			"#1C1C1E",
			"#2C2C2E",
			"#FAFAFA",
			"#B2B2B3",
			"#0091FF",
			"#000000",
			"#3A3A3C",
			"#0091FF",
			"#0091FF",
			"#30D158",
			"#FF9230",
		),
	},
];

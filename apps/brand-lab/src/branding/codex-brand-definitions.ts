import { type CodexThemeSeed, codexThemeSeeds } from "./codex-theme-seeds";
import type { BrandProject } from "./contract";
import type { BrandPresetDefinition } from "./preset-definition";
import {
	accessibleForeground,
	mixHex,
	normalizeBrandColors,
	relativeLuminance,
} from "./theme-color";

type BrandColors = BrandProject["colors"];

export const codexBrandDefinitions: readonly BrandPresetDefinition[] =
	codexThemeSeeds.map((seed) => {
		const terminalLike =
			seed.terminalAdaptive || seed.id === "1337" || seed.id === "dark-neon";

		return {
			id: `codex-${seed.id}`,
			name: `Codex · ${seed.name}`,
			source: "codex-open-source",
			description: seed.terminalAdaptive
				? "Terminal-adaptive Codex palette resolved to deterministic web colors for this MVP."
				: "Open-source Codex TUI palette adapted to semantic application tokens without copying component behavior.",
			upstreamThemeId: seed.id,
			terminalAdaptive: seed.terminalAdaptive,
			typography: {
				bodyFamily: terminalLike ? "mono" : "system-sans",
				headingFamily: terminalLike ? "mono" : "system-sans",
				baseSize: terminalLike ? 15 : 16,
				headingWeight: 700,
			},
			shape: terminalLike
				? { controlRadius: 4, cardRadius: 8, borderWidth: 1 }
				: { controlRadius: 8, cardRadius: 14, borderWidth: 1 },
			elevation: terminalLike ? "none" : "subtle",
			density: terminalLike ? "compact" : "comfortable",
			light: codexPalette(seed, "light"),
			dark: codexPalette(seed, "dark"),
		};
	});

function codexPalette(
	seed: CodexThemeSeed,
	appearance: BrandProject["appearance"],
): BrandColors {
	const sourceIsLight = relativeLuminance(seed.background) >= 0.52;
	const [primary, secondary, tertiary] = seed.accents;
	const accent = primary ?? seed.foreground;
	const chartSecondary = secondary ?? accent;
	const chartTertiary = tertiary ?? chartSecondary;

	if (appearance === "light") {
		const background = sourceIsLight
			? mixHex(seed.background, "#FFFFFF", 0.12)
			: mixHex("#FFFFFF", seed.background, 0.075);
		const surface = mixHex(background, "#FFFFFF", 0.72);
		const sourceText = sourceIsLight
			? seed.foreground
			: mixHex("#11141A", seed.background, 0.08);
		const textMuted = mixHex(sourceText, background, 0.36);

		return normalizeBrandColors(
			{
				background,
				surface,
				surfaceMuted: mixHex(background, sourceText, 0.065),
				text: sourceText,
				textMuted,
				accent,
				accentForeground: accessibleForeground(accent),
				border: mixHex(background, sourceText, 0.16),
				focus: chartSecondary,
				chartPrimary: accent,
				chartSecondary,
				chartTertiary,
			},
			appearance,
		);
	}

	const background = sourceIsLight
		? mixHex("#07090E", accent, 0.07)
		: seed.background;
	const surface = mixHex(background, "#FFFFFF", 0.065);
	const sourceText = sourceIsLight
		? mixHex("#FFFFFF", seed.foreground, 0.1)
		: seed.foreground;
	const textMuted = mixHex(sourceText, background, 0.34);

	return normalizeBrandColors(
		{
			background,
			surface,
			surfaceMuted: mixHex(background, "#FFFFFF", 0.12),
			text: sourceText,
			textMuted,
			accent,
			accentForeground: accessibleForeground(accent),
			border: mixHex(background, sourceText, 0.16),
			focus: chartSecondary,
			chartPrimary: accent,
			chartSecondary,
			chartTertiary,
		},
		appearance,
	);
}

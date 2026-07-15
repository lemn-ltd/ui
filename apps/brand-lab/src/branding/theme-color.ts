import type { BrandProject } from "./contract";

interface RgbColor {
	readonly red: number;
	readonly green: number;
	readonly blue: number;
}

type BrandColors = BrandProject["colors"];

const WHITE = "#FFFFFF";
const BLACK = "#000000";

export function mixHex(from: string, to: string, toWeight: number): string {
	const start = parseHex(from);
	const end = parseHex(to);
	const weight = clamp(toWeight, 0, 1);

	return formatHex({
		red: interpolate(start.red, end.red, weight),
		green: interpolate(start.green, end.green, weight),
		blue: interpolate(start.blue, end.blue, weight),
	});
}

export function relativeLuminance(color: string): number {
	const { red, green, blue } = parseHex(color);
	const [r, g, b] = [red, green, blue].map((channel) => {
		const normalized = channel / 255;
		return normalized <= 0.04045
			? normalized / 12.92
			: ((normalized + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

export function contrastRatio(first: string, second: string): number {
	const firstLuminance = relativeLuminance(first);
	const secondLuminance = relativeLuminance(second);
	const lighter = Math.max(firstLuminance, secondLuminance);
	const darker = Math.min(firstLuminance, secondLuminance);
	return (lighter + 0.05) / (darker + 0.05);
}

export function accessibleForeground(background: string): string {
	return contrastRatio(WHITE, background) >= contrastRatio(BLACK, background)
		? WHITE
		: BLACK;
}

export function ensureContrast(
	color: string,
	background: string,
	minimumRatio: number,
	preferredDirection?: "lighter" | "darker",
): string {
	const normalized = normalizeHex(color);
	if (contrastRatio(normalized, background) >= minimumRatio) {
		return normalized;
	}

	const directions = preferredDirection
		? [preferredDirection]
		: (["lighter", "darker"] as const);
	let best = normalized;
	let bestWeight = Number.POSITIVE_INFINITY;

	for (const direction of directions) {
		const target = direction === "lighter" ? WHITE : BLACK;
		for (let step = 1; step <= 100; step += 1) {
			const weight = step / 100;
			const candidate = mixHex(normalized, target, weight);
			if (contrastRatio(candidate, background) >= minimumRatio) {
				if (weight < bestWeight) {
					best = candidate;
					bestWeight = weight;
				}
				break;
			}
		}
	}

	if (bestWeight < Number.POSITIVE_INFINITY) return best;
	return preferredDirection === "lighter" ? WHITE : BLACK;
}

export function normalizeBrandColors(
	colors: BrandColors,
	appearance: BrandProject["appearance"],
): BrandColors {
	const textDirection = appearance === "light" ? "darker" : "lighter";
	const text = ensureContrast(colors.text, colors.background, 7, textDirection);
	const textOnSurface = ensureContrast(text, colors.surface, 7, textDirection);
	const textMutedOnSurface = ensureContrast(
		colors.textMuted,
		colors.surface,
		4.5,
		textDirection,
	);
	const textMuted = ensureContrast(
		textMutedOnSurface,
		colors.background,
		4.5,
		textDirection,
	);
	const accent = normalizeHex(colors.accent);
	const suppliedAccentForeground = ensureContrast(
		colors.accentForeground,
		accent,
		4.5,
	);

	return {
		background: normalizeHex(colors.background),
		surface: normalizeHex(colors.surface),
		surfaceMuted: normalizeHex(colors.surfaceMuted),
		text: textOnSurface,
		textMuted,
		accent,
		accentForeground:
			contrastRatio(suppliedAccentForeground, accent) >= 4.5
				? suppliedAccentForeground
				: accessibleForeground(accent),
		border: normalizeHex(colors.border),
		focus: ensureContrast(colors.focus, colors.background, 3),
		chartPrimary: ensureContrast(colors.chartPrimary, colors.surface, 3),
		chartSecondary: ensureContrast(colors.chartSecondary, colors.surface, 3),
		chartTertiary: ensureContrast(colors.chartTertiary, colors.surface, 3),
	};
}

export function normalizeHex(color: string): string {
	return formatHex(parseHex(color));
}

function parseHex(color: string): RgbColor {
	const match = /^#([0-9a-f]{6})$/i.exec(color);
	if (!match?.[1]) throw new Error(`Invalid six-digit hex color: ${color}`);
	const value = Number.parseInt(match[1], 16);
	return {
		red: (value >> 16) & 255,
		green: (value >> 8) & 255,
		blue: value & 255,
	};
}

function formatHex({ red, green, blue }: RgbColor): string {
	return `#${[red, green, blue]
		.map((channel) =>
			Math.round(clamp(channel, 0, 255))
				.toString(16)
				.padStart(2, "0"),
		)
		.join("")}`.toUpperCase();
}

function interpolate(start: number, end: number, weight: number): number {
	return start + (end - start) * weight;
}

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(maximum, Math.max(minimum, value));
}

export const DEFAULT_ACCENT_COLOR = "#0d9488";
export const ACCENT_COLOR_STORAGE_KEY = "accent-color";

const ACCENT_PROPERTIES = [
	"--accent",
	"--accent-strong",
	"--accent-soft",
	"--focus-ring",
] as const;

export interface HsvColor {
	readonly hue: number;
	readonly saturation: number;
	readonly value: number;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export function normalizeAccentColor(value: string): string | undefined {
	const match = /^#?([\da-f]{6})$/i.exec(value.trim());
	return match?.[1] ? `#${match[1].toLowerCase()}` : undefined;
}

export function hexToHsv(value: string): HsvColor {
	const normalized = normalizeAccentColor(value) ?? DEFAULT_ACCENT_COLOR;
	const red = Number.parseInt(normalized.slice(1, 3), 16) / 255;
	const green = Number.parseInt(normalized.slice(3, 5), 16) / 255;
	const blue = Number.parseInt(normalized.slice(5, 7), 16) / 255;
	const max = Math.max(red, green, blue);
	const min = Math.min(red, green, blue);
	const delta = max - min;
	let hue = 0;

	if (delta > 0) {
		if (max === red) hue = 60 * (((green - blue) / delta) % 6);
		else if (max === green) hue = 60 * ((blue - red) / delta + 2);
		else hue = 60 * ((red - green) / delta + 4);
	}

	return {
		hue: Math.round(hue < 0 ? hue + 360 : hue),
		saturation: Math.round(max === 0 ? 0 : (delta / max) * 100),
		value: Math.round(max * 100),
	};
}

export function hsvToHex({ hue, saturation, value }: HsvColor): string {
	const normalizedHue = ((hue % 360) + 360) % 360;
	const normalizedSaturation = clamp(saturation, 0, 100) / 100;
	const normalizedValue = clamp(value, 0, 100) / 100;
	const chroma = normalizedValue * normalizedSaturation;
	const sector = normalizedHue / 60;
	const secondary = chroma * (1 - Math.abs((sector % 2) - 1));
	const [redPart, greenPart, bluePart] =
		sector < 1
			? [chroma, secondary, 0]
			: sector < 2
				? [secondary, chroma, 0]
				: sector < 3
					? [0, chroma, secondary]
					: sector < 4
						? [0, secondary, chroma]
						: sector < 5
							? [secondary, 0, chroma]
							: [chroma, 0, secondary];
	const match = normalizedValue - chroma;
	const channel = (part: number): string =>
		Math.round((part + match) * 255)
			.toString(16)
			.padStart(2, "0");
	return `#${channel(redPart)}${channel(greenPart)}${channel(bluePart)}`;
}

function targetRoot(target?: HTMLElement): HTMLElement | undefined {
	if (target) return target;
	return typeof document === "undefined" ? undefined : document.documentElement;
}

/** Applies accessible light/dark accent derivatives while preserving the selected hue. */
export function applyAccentColor(value: string, target?: HTMLElement): string {
	const normalized = normalizeAccentColor(value) ?? DEFAULT_ACCENT_COLOR;
	const root = targetRoot(target);
	if (!root) return normalized;

	if (normalized === DEFAULT_ACCENT_COLOR) {
		for (const property of ACCENT_PROPERTIES)
			root.style.removeProperty(property);
		delete root.dataset.accentColor;
		return normalized;
	}

	const { hue, saturation, value: brightness } = hexToHsv(normalized);
	const chroma = 0.035 + (saturation / 100) * 0.135;
	const lightLightness = 0.4 + (brightness / 100) * 0.07;
	const darkLightness = 0.7 + (brightness / 100) * 0.12;
	const format = (number: number): string => number.toFixed(3);
	const color = (
		lightness: number,
		colorChroma = chroma,
		alpha?: number,
	): string =>
		`oklch(${format(lightness)} ${format(colorChroma)} ${hue}${alpha === undefined ? "" : ` / ${alpha}`})`;

	root.style.setProperty(
		"--accent",
		`light-dark(${color(lightLightness)}, ${color(darkLightness)})`,
	);
	root.style.setProperty(
		"--accent-strong",
		`light-dark(${color(lightLightness - 0.08)}, ${color(darkLightness - 0.09)})`,
	);
	root.style.setProperty(
		"--accent-soft",
		`light-dark(${color(0.96, chroma * 0.22)}, ${color(0.22, chroma * 0.24)})`,
	);
	root.style.setProperty(
		"--focus-ring",
		`light-dark(${color(lightLightness, chroma, 0.45)}, ${color(darkLightness, chroma, 0.55)})`,
	);
	root.dataset.accentColor = normalized;
	return normalized;
}

export function getAccentColor(): string {
	if (typeof window === "undefined") return DEFAULT_ACCENT_COLOR;
	try {
		return (
			normalizeAccentColor(
				window.localStorage.getItem(ACCENT_COLOR_STORAGE_KEY) ?? "",
			) ?? DEFAULT_ACCENT_COLOR
		);
	} catch {
		return DEFAULT_ACCENT_COLOR;
	}
}

export function setAccentColor(value: string, target?: HTMLElement): string {
	const normalized = applyAccentColor(value, target);
	if (typeof window !== "undefined") {
		try {
			if (normalized === DEFAULT_ACCENT_COLOR)
				window.localStorage.removeItem(ACCENT_COLOR_STORAGE_KEY);
			else window.localStorage.setItem(ACCENT_COLOR_STORAGE_KEY, normalized);
		} catch {
			// Storage can be unavailable in embedded or privacy-restricted contexts.
		}
	}
	return normalized;
}

export function resetAccentColor(target?: HTMLElement): void {
	applyAccentColor(DEFAULT_ACCENT_COLOR, target);
	if (typeof window !== "undefined") {
		try {
			window.localStorage.removeItem(ACCENT_COLOR_STORAGE_KEY);
		} catch {
			// Resetting runtime tokens remains useful even when storage is unavailable.
		}
	}
}

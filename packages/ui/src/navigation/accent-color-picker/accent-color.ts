export const DEFAULT_ACCENT_COLOR = "#0d9488";

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
		sector < 1 ? [chroma, secondary, 0]
			: sector < 2 ? [secondary, chroma, 0]
				: sector < 3 ? [0, chroma, secondary]
					: sector < 4 ? [0, secondary, chroma]
						: sector < 5 ? [secondary, 0, chroma]
							: [chroma, 0, secondary];
	const match = normalizedValue - chroma;
	const channel = (part: number): string => Math.round((part + match) * 255).toString(16).padStart(2, "0");
	return `#${channel(redPart)}${channel(greenPart)}${channel(bluePart)}`;
}

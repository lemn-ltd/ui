export type HexColor = `#${string}`;

type Rgb = { readonly red: number; readonly green: number; readonly blue: number };

export function normalizeHexColor(value: string): HexColor {
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) throw new Error(`Invalid six-digit hex color: ${value}`);
  return value.toLowerCase() as HexColor;
}

export function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

export function bestContrastingColor(background: string, candidates: readonly string[] = ["#000000", "#ffffff"]): HexColor {
  if (candidates.length === 0) throw new Error("At least one contrast candidate is required");
  let best = normalizeHexColor(candidates[0] ?? "#000000");
  let bestRatio = contrastRatio(best, background);
  for (const candidate of candidates.slice(1)) {
    const normalized = normalizeHexColor(candidate);
    const ratio = contrastRatio(normalized, background);
    if (ratio > bestRatio) {
      best = normalized;
      bestRatio = ratio;
    }
  }
  return best;
}

export function mixHexColors(first: string, second: string, secondWeight: number): HexColor {
  if (!Number.isFinite(secondWeight) || secondWeight < 0 || secondWeight > 1) {
    throw new Error("Color weight must be between zero and one");
  }
  const left = parseHex(first);
  const right = parseHex(second);
  const channel = (a: number, b: number) => Math.round(a * (1 - secondWeight) + b * secondWeight);
  return rgbToHex({
    red: channel(left.red, right.red),
    green: channel(left.green, right.green),
    blue: channel(left.blue, right.blue)
  });
}

export function translucentHex(color: string, alpha: number): string {
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) throw new Error("Alpha must be between zero and one");
  const rgb = parseHex(color);
  return `rgb(${rgb.red} ${rgb.green} ${rgb.blue} / ${formatNumber(alpha)})`;
}

function relativeLuminance(value: string): number {
  const rgb = parseHex(value);
  const linear = (channel: number): number => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(rgb.red) + 0.7152 * linear(rgb.green) + 0.0722 * linear(rgb.blue);
}

function parseHex(value: string): Rgb {
  const normalized = normalizeHexColor(value).slice(1);
  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16)
  };
}

function rgbToHex(rgb: Rgb): HexColor {
  const encode = (value: number) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
  return `#${encode(rgb.red)}${encode(rgb.green)}${encode(rgb.blue)}`;
}

function formatNumber(value: number): string {
  return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

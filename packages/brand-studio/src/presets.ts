import {
  BRAND_PROJECT_SCHEMA_URL,
  BRAND_SCHEMA_VERSION,
  bestContrastingColor,
  parseBrandProject,
  type BrandMode,
  type BrandProject
} from "@lemn-ltd/brand-contract";

export type BrandPreset = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly light: { readonly canvas: string; readonly muted: string; readonly accent: string };
  readonly dark: { readonly canvas: string; readonly surface: string; readonly accent: string };
  readonly radius: number;
  readonly density: "compact" | "comfortable" | "spacious";
  readonly heading: "Inter" | "Georgia";
};

export const brandPresets: readonly BrandPreset[] = [
  preset("aster-vault", "Aster Vault", "Quiet indigo structure with emerald data signals.", "#f5f6ff", "#eceefe", "#4f46c8", "#090a14", "#121426", "#9b95ff", 12),
  preset("verdant-ledger", "Verdant Ledger", "Measured botanical greens for operational products.", "#f3f8f5", "#e7f1eb", "#087a55", "#07110d", "#0f1b15", "#55d6a2", 14),
  preset("ember-studio", "Ember Studio", "Warm editorial surfaces with analytical restraint.", "#fff7f2", "#fcebe0", "#b94812", "#150b07", "#21120c", "#ff8a4c", 10, "comfortable", "Georgia"),
  preset("tideglass", "Tideglass", "Airy cyan surfaces with ocean-blue focus.", "#f2fafc", "#e3f4f7", "#006f8e", "#061216", "#0d1d22", "#4dd4f2", 16, "spacious"),
  preset("orchid-signal", "Orchid Signal", "Expressive orchid identity with calm neutral surfaces.", "#fdf7ff", "#f6e8fb", "#7e22ce", "#120717", "#201027", "#d8b4fe", 14, "comfortable", "Georgia"),
  preset("cobalt-transit", "Cobalt Transit", "Direct blue hierarchy for fast operational workflows.", "#f5f8ff", "#e7efff", "#1d4ed8", "#070d1d", "#101a31", "#93c5fd", 8, "compact"),
  preset("saffron-field", "Saffron Field", "Earthy gold and ink for human-centered tools.", "#fffbeb", "#fef3c7", "#92400e", "#171006", "#251a09", "#fbbf24", 12, "comfortable", "Georgia"),
  preset("rosewood-notes", "Rosewood Notes", "A composed rose palette for editorial products.", "#fff7f8", "#ffe4e9", "#9f1239", "#18080d", "#281018", "#fda4af", 10, "comfortable", "Georgia"),
  preset("alpine-console", "Alpine Console", "Crisp forest tones for dependable system surfaces.", "#f4faf6", "#e5f5ea", "#166534", "#07120b", "#101f15", "#86efac", 8, "compact"),
  preset("slate-bureau", "Slate Bureau", "Neutral slate for dense administrative products.", "#f8fafc", "#e2e8f0", "#334155", "#070b12", "#111827", "#cbd5e1", 6, "compact"),
  preset("copper-pulse", "Copper Pulse", "Confident copper accents on quiet warm surfaces.", "#fff8f3", "#ffeadc", "#9a3412", "#160b06", "#26130c", "#fdba74", 12),
  preset("iris-grid", "Iris Grid", "Structured violet for data-rich creative systems.", "#faf7ff", "#efe7ff", "#6d28d9", "#0e0718", "#1b102c", "#c4b5fd", 14),
  preset("lagoon-index", "Lagoon Index", "Balanced teal for reporting and service products.", "#f2fbfa", "#dff6f2", "#0f766e", "#061413", "#0d2421", "#5eead4", 12),
  preset("night-bloom", "Night Bloom", "Magenta energy contained by editorial neutrals.", "#fff7fe", "#f9e6f7", "#86198f", "#150817", "#241027", "#f0abfc", 16, "spacious", "Georgia"),
  preset("solar-ink", "Solar Ink", "A bright ochre signal paired with precise ink surfaces.", "#fffceb", "#fef5bd", "#854d0e", "#151104", "#24200c", "#fde047", 10, "comfortable", "Georgia")
];

export function createBrandFromPreset(presetId: string, options: { brandId?: string; name?: string } = {}): BrandProject {
  const source = brandPresets.find((entry) => entry.id === presetId);
  if (!source) throw new Error(`Unknown brand preset: ${presetId}`);
  const brandId = options.brandId ?? source.id;
  return parseBrandProject({
    $schema: BRAND_PROJECT_SCHEMA_URL,
    schemaVersion: BRAND_SCHEMA_VERSION,
    brandId,
    name: options.name ?? source.name,
    metadata: {
      description: source.description,
      tags: ["lemn-original"],
      owner: "LEMN",
      externalReferences: {}
    },
    assets: {},
    defaultProfileId: "core",
    profiles: {
      core: {
        name: "Core",
        defaultMode: "light",
        modes: {
          light: createMode(source, "light"),
          dark: createMode(source, "dark")
        },
        runtimeSelection: { selectable: true, allowedModes: ["light", "dark"] }
      }
    }
  });
}

function preset(
  id: string,
  name: string,
  description: string,
  lightCanvas: string,
  lightMuted: string,
  lightAccent: string,
  darkCanvas: string,
  darkSurface: string,
  darkAccent: string,
  radius: number,
  density: BrandPreset["density"] = "comfortable",
  heading: BrandPreset["heading"] = "Inter"
): BrandPreset {
  return {
    id,
    name,
    description,
    light: { canvas: lightCanvas, muted: lightMuted, accent: lightAccent },
    dark: { canvas: darkCanvas, surface: darkSurface, accent: darkAccent },
    radius,
    density,
    heading
  };
}

function createMode(presetSource: BrandPreset, colorScheme: "light" | "dark"): BrandMode {
  const dark = colorScheme === "dark";
  const accent = dark ? presetSource.dark.accent : presetSource.light.accent;
  const canvas = dark ? presetSource.dark.canvas : presetSource.light.canvas;
  const surface = dark ? presetSource.dark.surface : "#ffffff";
  const surfaceMuted = dark ? mixSurface(presetSource.dark.surface, "#ffffff", 0.08) : presetSource.light.muted;
  const radius = `${presetSource.radius}px`;
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
      selection: dark ? "#334155" : presetSource.light.muted,
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
        : { surface: "#dbeafe", foreground: "#1e3a8a", border: "#1d4ed8" }
    },
    typography: {
      body: { family: "Inter", fallbacks: ["system-ui", "sans-serif"], weights: [400, 500, 600] },
      heading: { family: presetSource.heading, fallbacks: presetSource.heading === "Georgia" ? ["serif"] : ["system-ui", "sans-serif"], weights: [600, 700] },
      label: { family: "Inter", fallbacks: ["system-ui", "sans-serif"], weights: [500, 600] },
      code: { family: "ui-monospace", fallbacks: ["monospace"], weights: [400, 600] },
      fontDisplay: "swap",
      baseSize: 16,
      displaySize: 52,
      titleSize: 30,
      bodyLineHeight: 1.5,
      headingLineHeight: 1.1,
      tracking: 0
    },
    shape: {
      borderWidth: "1px",
      borderStyle: "solid",
      radiusSmall: `${Math.max(2, presetSource.radius - 6)}px`,
      radiusMedium: `${Math.max(4, presetSource.radius - 2)}px`,
      radiusLarge: `${presetSource.radius + 6}px`,
      radiusControl: radius,
      radiusCard: `${presetSource.radius + 4}px`,
      radiusPill: "999px",
      outlineTreatment: "outside"
    },
    elevation: {
      raised: dark ? "0 1px 2px rgb(0 0 0 / 0.45)" : "0 1px 3px rgb(15 23 42 / 0.1)",
      overlay: dark ? "0 12px 30px rgb(0 0 0 / 0.65)" : "0 12px 30px rgb(15 23 42 / 0.16)",
      modal: dark ? "0 24px 60px rgb(0 0 0 / 0.75)" : "0 24px 60px rgb(15 23 42 / 0.22)",
      focusRingWidth: "2px",
      focusRingOffset: "2px"
    },
    spacingAndDensity: {
      density: presetSource.density,
      scale: presetSource.density === "compact" ? 0.9 : presetSource.density === "spacious" ? 1.12 : 1,
      controlHeight: presetSource.density === "compact" ? "36px" : presetSource.density === "spacious" ? "46px" : "40px",
      contentGutter: presetSource.density === "compact" ? "18px" : presetSource.density === "spacious" ? "32px" : "24px"
    },
    motion: {
      durationFast: "100ms",
      durationNormal: "180ms",
      durationSlow: "300ms",
      easingStandard: "cubic-bezier(0.2, 0, 0, 1)",
      easingEmphasized: "cubic-bezier(0.2, 0, 0, 1)",
      decorativeMotion: true,
      reducedMotion: "reduce"
    },
    visualization: {
      categorical: [accent, "#0f766e", "#b45309", "#7e22ce", "#be123c", "#0369a1"],
      sequential: [dark ? "#1e293b" : "#e2e8f0", accent, dark ? "#f8fafc" : "#0f172a"],
      diverging: ["#b91c1c", dark ? "#475569" : "#e2e8f0", "#1d4ed8"],
      positive: "#16a34a",
      negative: "#dc2626",
      neutral: dark ? "#94a3b8" : "#64748b",
      axis: dark ? "#cbd5e1" : "#475569",
      grid: dark ? "#334155" : "#cbd5e1",
      label: dark ? "#e2e8f0" : "#334155",
      tooltipSurface: dark ? "#0f172a" : "#0f172a",
      tooltipBorder: dark ? "#64748b" : "#334155",
      tooltipText: "#ffffff",
      cursor: accent,
      crosshair: accent,
      selection: dark ? "#334155" : presetSource.light.muted,
      mutedOpacity: 0.55,
      inactiveOpacity: 0.25
    },
    iconography: { family: "Lucide", style: "outline", strokeWidth: 2, defaultSize: "20px" },
    accessibility: {
      standard: "WCAG-2.2-AA",
      normalTextContrast: 4.5,
      largeTextContrast: 3,
      nonTextContrast: 3,
      minimumTargetSize: 44,
      forceVisibleFocus: true,
      forcedColors: "system",
      automaticCorrections: "derived-only"
    },
    componentAppearance: { controls: "solid", cards: "bordered", inputs: "outlined" }
  };
}

function mixSurface(first: string, second: string, weight: number): string {
  const parse = (value: string) => [1, 3, 5].map((start) => Number.parseInt(value.slice(start, start + 2), 16));
  const left = parse(first);
  const right = parse(second);
  return `#${left.map((value, index) => Math.round(value * (1 - weight) + (right[index] ?? value) * weight).toString(16).padStart(2, "0")).join("")}`;
}

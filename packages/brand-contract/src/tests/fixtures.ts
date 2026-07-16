import {
	BRAND_PROJECT_SCHEMA_URL,
	BRAND_SCHEMA_VERSION,
	type BrandMode,
	type BrandProfileSource,
	type BrandProject,
	type BrandTypography,
} from "../index.js";

const LIGHT_COLORS: BrandMode["colors"] = {
	canvas: "#ffffff",
	surface: "#ffffff",
	surfaceMuted: "#f3f4f6",
	surfaceElevated: "#ffffff",
	surfaceOverlay: "#ffffff",
	text: "#111827",
	textMuted: "#4b5563",
	textInverse: "#ffffff",
	accent: "#1d4ed8",
	accentForeground: "#ffffff",
	border: "#d1d5db",
	borderStrong: "#6b7280",
	focus: "#1d4ed8",
	selection: "#dbeafe",
	disabledSurface: "#f3f4f6",
	disabledText: "#6b7280",
	success: { surface: "#dcfce7", foreground: "#14532d", border: "#15803d" },
	warning: { surface: "#fef3c7", foreground: "#78350f", border: "#b45309" },
	danger: { surface: "#fee2e2", foreground: "#7f1d1d", border: "#b91c1c" },
	info: { surface: "#dbeafe", foreground: "#1e3a8a", border: "#1d4ed8" },
};

const DARK_COLORS: BrandMode["colors"] = {
	canvas: "#030712",
	surface: "#111827",
	surfaceMuted: "#1f2937",
	surfaceElevated: "#1f2937",
	surfaceOverlay: "#111827",
	text: "#f9fafb",
	textMuted: "#d1d5db",
	textInverse: "#111827",
	accent: "#60a5fa",
	accentForeground: "#111827",
	border: "#374151",
	borderStrong: "#9ca3af",
	focus: "#60a5fa",
	selection: "#1e3a8a",
	disabledSurface: "#1f2937",
	disabledText: "#9ca3af",
	success: { surface: "#052e16", foreground: "#bbf7d0", border: "#22c55e" },
	warning: { surface: "#451a03", foreground: "#fef3c7", border: "#f59e0b" },
	danger: { surface: "#450a0a", foreground: "#fecaca", border: "#ef4444" },
	info: { surface: "#172554", foreground: "#dbeafe", border: "#3b82f6" },
};

export function makeMode(colorScheme: "light" | "dark"): BrandMode {
	const dark = colorScheme === "dark";
	return {
		colorScheme,
		colors: structuredClone(dark ? DARK_COLORS : LIGHT_COLORS),
		shape: {
			borderWidth: "1px",
			borderStyle: "solid",
			radiusSmall: "4px",
			radiusMedium: "8px",
			radiusLarge: "16px",
			radiusControl: "8px",
			radiusCard: "12px",
			radiusPill: "999px",
			outlineTreatment: "outside",
		},
		elevation: {
			raised: dark
				? "0 1px 2px rgb(0 0 0 / 0.4)"
				: "0 1px 2px rgb(0 0 0 / 0.1)",
			overlay: dark
				? "0 8px 24px rgb(0 0 0 / 0.6)"
				: "0 8px 24px rgb(0 0 0 / 0.15)",
			modal: dark
				? "0 16px 48px rgb(0 0 0 / 0.7)"
				: "0 16px 48px rgb(0 0 0 / 0.2)",
			focusRingWidth: "2px",
			focusRingOffset: "2px",
		},
		spacingAndDensity: {
			density: "comfortable",
			scale: 1,
			controlHeight: "40px",
			contentGutter: "24px",
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
			categorical: ["#2563eb", "#16a34a", "#dc2626", "#9333ea"],
			sequential: ["#dbeafe", "#60a5fa", "#1d4ed8"],
			diverging: ["#dc2626", "#f3f4f6", "#2563eb"],
			positive: "#16a34a",
			negative: "#dc2626",
			neutral: "#6b7280",
			axis: dark ? "#d1d5db" : "#4b5563",
			grid: dark ? "#374151" : "#d1d5db",
			tooltipSurface: dark ? "#111827" : "#111827",
			tooltipBorder: dark ? "#6b7280" : "#374151",
			tooltipText: "#ffffff",
			cursor: dark ? "#60a5fa" : "#1d4ed8",
			selection: dark ? "#1e3a8a" : "#dbeafe",
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

export function makeTypography(): BrandTypography {
	return {
		catalogVersion: 1,
		body: {
			source: "system",
			ref: "system.ui",
			fidelity: "preferred",
			emergencyFallbackRef: "system.sans",
			weights: [400, 500, 600],
			styles: ["normal"],
		},
		heading: { source: "inherit", role: "body" },
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
		displaySize: 48,
		titleSize: 28,
		bodyLineHeight: 1.5,
		headingLineHeight: 1.15,
		tracking: 0,
	};
}

export function makeBrandProject(): BrandProject {
	return {
		$schema: BRAND_PROJECT_SCHEMA_URL,
		schemaVersion: BRAND_SCHEMA_VERSION,
		brandId: "lunaria-care",
		name: "Lunaria Care",
		metadata: {
			description: "A complete deterministic brand fixture",
			tags: ["healthcare", "appointments"],
			owner: "LEMN",
			externalReferences: {},
		},
		assets: {
			"logo-main": {
				id: "logo-main",
				kind: "logo",
				storageKey: "brands/lunaria/logo-main.svg",
				sha256: "1".repeat(64),
				mediaType: "image/svg+xml",
				width: 320,
				height: 96,
				accessibleLabel: "Lunaria Care",
			},
		},
		defaultProfileId: "core",
		profiles: {
			core: {
				name: "Core",
				defaultMode: "light",
				typography: makeTypography(),
				modes: {
					light: makeMode("light"),
					dark: makeMode("dark"),
				},
				assets: {
					primaryLogo: "logo-main",
				},
				runtimeSelection: { selectable: true },
			},
			pediatrics: {
				name: "Pediatrics",
				description: "Inherits the complete Core modes and assets",
				extends: "core",
				defaultMode: "dark",
				modes: {},
				runtimeSelection: { selectable: true },
			},
		},
	};
}

export function fixtureProfile(
	project: BrandProject,
	profileId: string,
): BrandProfileSource {
	const profile = project.profiles[profileId];
	if (!profile) throw new Error(`Fixture profile '${profileId}' is missing`);
	return profile;
}

export function fixtureMode(
	project: BrandProject,
	profileId: string,
	modeId: string,
): BrandMode {
	const mode = fixtureProfile(project, profileId).modes[modeId];
	if (!mode) {
		throw new Error(`Fixture mode '${profileId}/${modeId}' is missing`);
	}
	return mode;
}

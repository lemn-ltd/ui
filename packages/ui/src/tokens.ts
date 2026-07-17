/**
 * Complete semantic token vocabulary consumed by LEMN components.
 * Values are supplied by a compiled BrandingDefinition mode; this module owns
 * no Workspace, mode selection, persistence, or browser-global theme state.
 */
export const tokens = {
	color: {
		canvas: "--lemn-color-canvas",
		surface: "--lemn-color-surface",
		surfaceMuted: "--lemn-color-surface-muted",
		surfaceElevated: "--lemn-color-surface-elevated",
		surfaceOverlay: "--lemn-color-surface-overlay",
		text: "--lemn-color-text",
		textMuted: "--lemn-color-text-muted",
		textInverse: "--lemn-color-text-inverse",
		disabledText: "--lemn-color-disabled-text",
		disabledSurface: "--lemn-color-disabled-surface",
		border: "--lemn-color-border",
		borderStrong: "--lemn-color-border-strong",
		accent: "--lemn-color-accent",
		accentForeground: "--lemn-color-accent-foreground",
		accentHover: "--lemn-color-accent-hover",
		accentPressed: "--lemn-color-accent-pressed",
		accentSoft: "--lemn-color-accent-soft",
		focus: "--lemn-color-focus",
		selection: "--lemn-color-selection",
		overlayScrim: "--lemn-color-overlay-scrim",
		success: "--lemn-color-success",
		successSurface: "--lemn-color-success-surface",
		successForeground: "--lemn-color-success-foreground",
		warning: "--lemn-color-warning",
		warningSurface: "--lemn-color-warning-surface",
		warningForeground: "--lemn-color-warning-foreground",
		danger: "--lemn-color-danger",
		dangerSurface: "--lemn-color-danger-surface",
		dangerForeground: "--lemn-color-danger-foreground",
		info: "--lemn-color-info",
		infoSurface: "--lemn-color-info-surface",
		infoForeground: "--lemn-color-info-foreground",
	},
	chart: {
		series: [
			"--lemn-chart-series-1",
			"--lemn-chart-series-2",
			"--lemn-chart-series-3",
			"--lemn-chart-series-4",
			"--lemn-chart-series-5",
			"--lemn-chart-series-6",
			"--lemn-chart-series-7",
			"--lemn-chart-series-8",
		],
		grid: "--lemn-chart-grid",
		axis: "--lemn-chart-axis",
		label: "--lemn-chart-label",
		cursor: "--lemn-chart-cursor",
		crosshair: "--lemn-chart-crosshair",
		hover: "--lemn-chart-hover",
		selection: "--lemn-chart-selection",
		tooltipSurface: "--lemn-chart-tooltip-surface",
		tooltipBorder: "--lemn-chart-tooltip-border",
		tooltipText: "--lemn-chart-tooltip-text",
		positive: "--lemn-chart-positive",
		negative: "--lemn-chart-negative",
		neutral: "--lemn-chart-neutral",
		mutedOpacity: "--lemn-chart-muted-opacity",
		inactiveOpacity: "--lemn-chart-inactive-opacity",
	},
	spacing: {
		0: "--lemn-space-0",
		1: "--lemn-space-1",
		2: "--lemn-space-2",
		3: "--lemn-space-3",
		4: "--lemn-space-4",
		5: "--lemn-space-5",
		6: "--lemn-space-6",
		8: "--lemn-space-8",
		10: "--lemn-space-10",
		12: "--lemn-space-12",
		16: "--lemn-space-16",
	},
	density: {
		scale: "--lemn-density-scale",
		controlHeight: "--lemn-control-height",
		contentGutter: "--lemn-content-gutter",
	},
	shape: {
		small: "--lemn-radius-small",
		medium: "--lemn-radius-medium",
		large: "--lemn-radius-large",
		control: "--lemn-radius-control",
		card: "--lemn-radius-card",
		pill: "--lemn-radius-pill",
		full: "--lemn-radius-full",
		borderWidth: "--lemn-border-width",
		borderStyle: "--lemn-border-style",
		outlineTreatment: "--lemn-outline-treatment",
	},
	appearance: {
		controls: "--lemn-component-controls",
		cards: "--lemn-component-cards",
		inputs: "--lemn-component-inputs",
	},
	iconography: {
		style: "--lemn-icon-style",
		strokeWidth: "--lemn-icon-stroke-width",
		size: "--lemn-icon-size",
	},
	typography: {
		family: {
			body: "--lemn-font-body",
			heading: "--lemn-font-heading",
			label: "--lemn-font-label",
			code: "--lemn-font-code",
		},
		display: "--lemn-font-display",
		size: {
			base: "--lemn-font-size-base",
			display: "--lemn-font-size-display",
			title: "--lemn-font-size-title",
			heading: "--lemn-font-size-heading",
			body: "--lemn-font-size-body",
			small: "--lemn-font-size-small",
			caption: "--lemn-font-size-caption",
			mono: "--lemn-font-size-mono",
		},
		lineHeight: {
			display: "--lemn-line-height-display",
			title: "--lemn-line-height-title",
			heading: "--lemn-line-height-heading",
			body: "--lemn-line-height-body",
			small: "--lemn-line-height-small",
			caption: "--lemn-line-height-caption",
			mono: "--lemn-line-height-mono",
		},
		letterSpacing: "--lemn-letter-spacing",
		weight: {
			regular: "--lemn-font-weight-regular",
			medium: "--lemn-font-weight-medium",
			semibold: "--lemn-font-weight-semibold",
		},
	},
	motion: {
		duration: {
			instant: "--lemn-duration-instant",
			fast: "--lemn-duration-fast",
			normal: "--lemn-duration-normal",
			slow: "--lemn-duration-slow",
		},
		easing: {
			standard: "--lemn-easing-standard",
			emphasized: "--lemn-easing-emphasized",
			linear: "--lemn-easing-linear",
		},
	},
	elevation: {
		shadow: {
			none: "--lemn-shadow-none",
			raised: "--lemn-shadow-raised",
			overlay: "--lemn-shadow-overlay",
			modal: "--lemn-shadow-modal",
		},
		focusRingWidth: "--lemn-focus-ring-width",
		focusRingOffset: "--lemn-focus-ring-offset",
	},
	layer: {
		raised: "--lemn-z-raised",
		chrome: "--lemn-z-chrome",
		window: "--lemn-z-window",
		scrim: "--lemn-z-scrim",
		drawer: "--lemn-z-drawer",
		dropdown: "--lemn-z-dropdown",
		modal: "--lemn-z-modal",
		popover: "--lemn-z-popover",
		toast: "--lemn-z-toast",
	},
	layout: {
		contentMax: "--lemn-content-max",
		scrollbarTrack: "--lemn-scrollbar-track",
		scrollbarThumb: "--lemn-scrollbar-thumb",
		scrollbarThumbHover: "--lemn-scrollbar-thumb-hover",
		scrollbarSize: "--lemn-scrollbar-size",
	},
} as const;

type TokenLeaf<T> = T extends string
	? T
	: T extends readonly (infer TItem)[]
		? TokenLeaf<TItem>
		: T extends Readonly<Record<PropertyKey, unknown>>
			? TokenLeaf<T[keyof T]>
			: never;

function collectTokenNames(value: unknown, result: string[] = []): string[] {
	if (typeof value === "string") {
		result.push(value);
	} else if (Array.isArray(value)) {
		for (const item of value) collectTokenNames(item, result);
	} else if (value && typeof value === "object") {
		for (const item of Object.values(value)) collectTokenNames(item, result);
	}
	return result;
}

export const brandTokenNames = Object.freeze(
	collectTokenNames(tokens),
) as readonly BrandTokenName[];

export type Tokens = typeof tokens;
export type BrandTokenName = TokenLeaf<Tokens>;

import type { CSSProperties, ReactNode } from "react";

export type ChartDatum = Readonly<Record<string, unknown>>;
export type ChartColor = `var(--${string})`;

export type ChartAccessibleName =
	| {
			readonly "aria-label": string;
			readonly "aria-labelledby"?: never;
	  }
	| {
			readonly "aria-label"?: never;
			readonly "aria-labelledby": string;
	  };

export interface ChartSeries<TDatum extends ChartDatum> {
	readonly color?: ChartColor;
	readonly dataKey: Extract<keyof TDatum, string>;
	readonly name: string;
	readonly valueFormatter?: (value: number) => string;
}

export type ChartMode = "default" | "stacked" | "percent";
export type ChartLegendPosition = "left" | "center" | "right";
export type ChartLegendOverflow = "wrap" | "scroll";
export type ChartTickInterval =
	| "equidistant-preserve-start"
	| "preserve-start-end";

export interface ChartXAxisOptions {
	readonly interval?: ChartTickInterval;
	readonly label?: string;
	readonly show?: boolean;
	readonly startEndOnly?: boolean;
	readonly tickGap?: number;
}

export interface ChartValueDomain {
	readonly autoMin?: boolean;
	readonly max?: number;
	readonly min?: number;
}

export interface ChartYAxisOptions extends ChartValueDomain {
	readonly allowDecimals?: boolean;
	readonly label?: string;
	readonly show?: boolean;
	readonly valueFormatter?: (value: number) => string;
	readonly width?: number;
}

export interface ChartTooltipEntry<TDatum extends ChartDatum> {
	readonly color: ChartColor;
	readonly dataKey: Extract<keyof TDatum, string>;
	readonly datum: TDatum;
	readonly name: string;
	readonly value: number;
}

export interface ChartTooltipContext<TDatum extends ChartDatum> {
	readonly active: boolean;
	readonly entries: readonly ChartTooltipEntry<TDatum>[];
	readonly label: string;
}

export type ChartSelection<TDatum extends ChartDatum> = {
	readonly dataKey: Extract<keyof TDatum, string>;
	readonly datum: TDatum;
	readonly indexValue: string;
	readonly kind: "datum";
	readonly name: string;
} | null;

export interface CartesianChartInteractionProps<TDatum extends ChartDatum> {
	readonly legendOverflow?: ChartLegendOverflow;
	readonly legendPosition?: ChartLegendPosition;
	readonly onTooltipChange?: (
		context: ChartTooltipContext<TDatum> | null,
	) => void;
	readonly onValueChange?: (value: ChartSelection<TDatum>) => void;
	readonly renderTooltip?: (context: ChartTooltipContext<TDatum>) => ReactNode;
	readonly xAxis?: ChartXAxisOptions | false;
	readonly yAxis?: ChartYAxisOptions | false;
}

export interface ChartStateProps {
	readonly className?: string;
	readonly emptyMessage?: string;
	readonly error?: string;
	readonly height?: number;
	readonly loading?: boolean;
	readonly onRetry?: () => void;
	readonly style?: CSSProperties;
}

export type ChartAnimation = "auto" | "none";

export const CHART_COLORS: readonly ChartColor[] = [
	"var(--lemn-chart-series-1)",
	"var(--lemn-chart-series-2)",
	"var(--lemn-chart-series-3)",
	"var(--lemn-chart-series-4)",
	"var(--lemn-chart-series-5)",
	"var(--lemn-chart-series-6)",
	"var(--lemn-chart-series-7)",
	"var(--lemn-chart-series-8)",
];

const DEFAULT_CHART_COLOR: ChartColor = "var(--lemn-chart-series-1)";

export function chartColor(
	color: ChartColor | undefined,
	index: number,
): ChartColor {
	return (
		color ?? CHART_COLORS[index % CHART_COLORS.length] ?? DEFAULT_CHART_COLOR
	);
}

export function numericValue(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value)
		? value
		: undefined;
}

export function resolveChartMode(
	mode: ChartMode | undefined,
	stacked: boolean | undefined,
): ChartMode {
	return mode ?? (stacked ? "stacked" : "default");
}

export function chartXAxisInterval(
	interval: ChartTickInterval | undefined,
): "equidistantPreserveStart" | "preserveStartEnd" {
	return interval === "preserve-start-end"
		? "preserveStartEnd"
		: "equidistantPreserveStart";
}

export function chartTickValue(value: unknown): string | number {
	return typeof value === "string" || typeof value === "number"
		? value
		: String(value ?? "");
}

export function chartAccessibleName(
	ariaLabel: string | undefined,
	ariaLabelledBy: string | undefined,
): ChartAccessibleName {
	if (ariaLabel) return { "aria-label": ariaLabel };
	if (ariaLabelledBy) return { "aria-labelledby": ariaLabelledBy };
	throw new Error(
		"An informative chart requires aria-label or aria-labelledby.",
	);
}

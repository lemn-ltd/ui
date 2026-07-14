import type { ReactElement } from "react";
import {
	Bar,
	CartesianGrid,
	ComposedChart,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { ChartVisualizationFrame } from "../internal/chart-a11y.js";
import { useChartAnimation } from "../internal/chart-animation.js";
import { useChartSeriesVisibility } from "../internal/chart-legend.js";
import {
	type ChartAccessibleName,
	type ChartAnimation,
	type ChartDatum,
	type ChartSeries,
	type ChartStateProps,
	chartAccessibleName,
	chartColor,
	numericValue,
} from "../internal/chart-types.js";
import "./combo-chart.css";

export interface ComboChartSeries<TDatum extends ChartDatum>
	extends ChartSeries<TDatum> {
	readonly axis?: "primary" | "secondary";
	readonly kind: "bar" | "line";
}

export type ComboChartProps<TDatum extends ChartDatum> = ChartAccessibleName &
	ChartStateProps & {
		readonly animation?: ChartAnimation;
		readonly data: readonly TDatum[];
		readonly index: Extract<keyof TDatum, string>;
		readonly series: readonly ComboChartSeries<TDatum>[];
		readonly showGrid?: boolean;
		readonly showLegend?: boolean;
		readonly showTooltip?: boolean;
	};

/** Composes declared bar and line series without exposing arbitrary renderers. */
export function ComboChart<TDatum extends ChartDatum>({
	animation = "auto",
	className,
	data,
	emptyMessage,
	error,
	height = 320,
	index,
	loading,
	onRetry,
	series,
	showGrid = true,
	showLegend = true,
	showTooltip = true,
	style,
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledBy,
}: ComboChartProps<TDatum>): ReactElement {
	const [hiddenSeries, toggleSeries] = useChartSeriesVisibility();
	const animationActive = useChartAnimation(
		animation,
		data.length * series.length,
	);
	const legendItems = series.map((item, seriesIndex) => ({
		color: chartColor(item.color, seriesIndex),
		id: item.dataKey,
		name: item.name,
	}));
	const hasSecondaryAxis = series.some((item) => item.axis === "secondary");
	const frameName = chartAccessibleName(ariaLabel, ariaLabelledBy);

	return (
		<ChartVisualizationFrame
			{...frameName}
			animationActive={animationActive}
			className={["ui-combo-chart", className].filter(Boolean).join(" ")}
			dataLength={data.length}
			emptyMessage={emptyMessage}
			error={error}
			height={height}
			hiddenSeries={showLegend ? hiddenSeries : undefined}
			legendItems={showLegend ? legendItems : undefined}
			loading={loading}
			onRetry={onRetry}
			onToggleSeries={showLegend ? toggleSeries : undefined}
			style={style}
			summary={`${data.length} data points combining ${series.filter((item) => item.kind === "bar").length} bar and ${series.filter((item) => item.kind === "line").length} line series.`}
		>
			<ResponsiveContainer height="100%" width="100%">
				<ComposedChart
					accessibilityLayer
					data={data}
					margin={{
						bottom: 8,
						left: 4,
						right: hasSecondaryAxis ? 4 : 12,
						top: 8,
					}}
				>
					{showGrid ? (
						<CartesianGrid
							stroke="var(--chart-grid)"
							strokeDasharray="3 3"
							vertical={false}
						/>
					) : null}
					<XAxis dataKey={index} stroke="var(--chart-axis)" tickLine={false} />
					<YAxis
						stroke="var(--chart-axis)"
						tickLine={false}
						width={44}
						yAxisId="primary"
					/>
					{hasSecondaryAxis ? (
						<YAxis
							orientation="right"
							stroke="var(--chart-axis)"
							tickLine={false}
							width={44}
							yAxisId="secondary"
						/>
					) : null}
					{showTooltip ? (
						<Tooltip
							contentStyle={{
								background: "var(--chart-tooltip-surface)",
								border: "1px solid var(--chart-tooltip-border)",
								borderRadius: "var(--radius-sm)",
								color: "var(--text)",
							}}
							cursor={{ fill: "var(--chart-cursor)" }}
							formatter={(value, name) => {
								const matchingSeries = series.find(
									(item) => item.dataKey === String(name),
								);
								const number = numericValue(value);
								return [
									number !== undefined && matchingSeries?.valueFormatter
										? matchingSeries.valueFormatter(number)
										: String(value ?? "—"),
									matchingSeries?.name ?? String(name),
								];
							}}
						/>
					) : null}
					{series.map((item, seriesIndex) => {
						const shared = {
							dataKey: item.dataKey,
							hide: hiddenSeries.has(item.dataKey),
							isAnimationActive: animationActive,
							name: item.name,
							yAxisId: item.axis ?? "primary",
						};
						const color = chartColor(item.color, seriesIndex);
						return item.kind === "bar" ? (
							<Bar
								{...shared}
								fill={color}
								key={item.dataKey}
								radius={[4, 4, 0, 0]}
							/>
						) : (
							<Line
								{...shared}
								dot={false}
								key={item.dataKey}
								stroke={color}
								strokeWidth={2}
								type="monotone"
							/>
						);
					})}
				</ComposedChart>
			</ResponsiveContainer>
		</ChartVisualizationFrame>
	);
}

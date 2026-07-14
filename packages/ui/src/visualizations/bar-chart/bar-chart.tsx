import type { ReactElement } from "react";
import {
	Bar,
	CartesianGrid,
	LabelList,
	BarChart as RechartsBarChart,
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
import "./bar-chart.css";

export type BarChartOrientation = "vertical" | "horizontal";

export type BarChartProps<TDatum extends ChartDatum> = ChartAccessibleName &
	ChartStateProps & {
		readonly animation?: ChartAnimation;
		readonly data: readonly TDatum[];
		readonly index: Extract<keyof TDatum, string>;
		readonly orientation?: BarChartOrientation;
		readonly series: readonly ChartSeries<TDatum>[];
		readonly showGrid?: boolean;
		readonly showLabels?: boolean;
		readonly showLegend?: boolean;
		readonly showTooltip?: boolean;
		readonly stacked?: boolean;
	};

export const BAR_CHART_LABEL_MARK_LIMIT = 24;
export const BAR_CHART_LABEL_CHARACTER_LIMIT = 12;

export function barChartLabelsAreVisible<TDatum extends ChartDatum>(
	data: readonly TDatum[],
	series: readonly ChartSeries<TDatum>[],
	requested: boolean,
): boolean {
	if (!requested || data.length * series.length > BAR_CHART_LABEL_MARK_LIMIT)
		return false;

	return series.every((item) =>
		data.every((datum) => {
			const value = numericValue(datum[item.dataKey]);
			const label =
				value === undefined
					? ""
					: (item.valueFormatter?.(value) ?? String(value));
			return label.length <= BAR_CHART_LABEL_CHARACTER_LIMIT;
		}),
	);
}

/** Grouped or stacked bar chart with horizontal and vertical orientations. */
export function BarChart<TDatum extends ChartDatum>({
	animation = "auto",
	className,
	data,
	emptyMessage,
	error,
	height = 320,
	index,
	loading,
	onRetry,
	orientation = "vertical",
	series,
	showGrid = true,
	showLabels = false,
	showLegend = true,
	showTooltip = true,
	stacked = false,
	style,
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledBy,
}: BarChartProps<TDatum>): ReactElement {
	const [hiddenSeries, toggleSeries] = useChartSeriesVisibility();
	const animationActive = useChartAnimation(
		animation,
		data.length * series.length,
	);
	const labelsVisible = barChartLabelsAreVisible(data, series, showLabels);
	const legendItems = series.map((item, seriesIndex) => ({
		color: chartColor(item.color, seriesIndex),
		id: item.dataKey,
		name: item.name,
	}));
	const frameName = chartAccessibleName(ariaLabel, ariaLabelledBy);
	const horizontal = orientation === "horizontal";

	return (
		<ChartVisualizationFrame
			{...frameName}
			animationActive={animationActive}
			className={["ui-bar-chart", className].filter(Boolean).join(" ")}
			dataLabelPolicy={
				showLabels
					? labelsVisible
						? "visible"
						: "hidden-collision"
					: "disabled"
			}
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
			summary={`${data.length} categories across ${series.length} ${stacked ? "stacked " : ""}${orientation} bar series: ${series.map((item) => item.name).join(", ")}.`}
		>
			<ResponsiveContainer height="100%" width="100%">
				<RechartsBarChart
					accessibilityLayer
					data={data}
					layout={horizontal ? "vertical" : "horizontal"}
					margin={{
						bottom: 8,
						left: horizontal ? 12 : 4,
						right: 12,
						top: labelsVisible ? 24 : 8,
					}}
				>
					{showGrid ? (
						<CartesianGrid
							horizontal={!horizontal}
							stroke="var(--chart-grid)"
							strokeDasharray="3 3"
							vertical={horizontal}
						/>
					) : null}
					{horizontal ? (
						<>
							<XAxis
								stroke="var(--chart-axis)"
								tickLine={false}
								type="number"
							/>
							<YAxis
								dataKey={index}
								stroke="var(--chart-axis)"
								tickLine={false}
								type="category"
								width={88}
							/>
						</>
					) : (
						<>
							<XAxis
								dataKey={index}
								stroke="var(--chart-axis)"
								tickLine={false}
								type="category"
							/>
							<YAxis
								stroke="var(--chart-axis)"
								tickLine={false}
								type="number"
								width={44}
							/>
						</>
					)}
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
					{series.map((item, seriesIndex) => (
						<Bar
							dataKey={item.dataKey}
							fill={chartColor(item.color, seriesIndex)}
							hide={hiddenSeries.has(item.dataKey)}
							isAnimationActive={animationActive}
							key={item.dataKey}
							name={item.name}
							radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
							stackId={stacked ? "bar-stack" : undefined}
						>
							{labelsVisible ? (
								<LabelList
									fill="var(--text-muted)"
									formatter={(label) => {
										const value = numericValue(label);
										return value === undefined
											? ""
											: (item.valueFormatter?.(value) ?? String(value));
									}}
									position={horizontal ? "right" : "top"}
								/>
							) : null}
						</Bar>
					))}
				</RechartsBarChart>
			</ResponsiveContainer>
		</ChartVisualizationFrame>
	);
}

import type { MouseEvent, ReactElement } from "react";
import {
	Bar,
	CartesianGrid,
	Label,
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
import { useChartSelection } from "../internal/chart-selection.js";
import { ChartTooltipContent } from "../internal/chart-tooltip.js";
import {
	type CartesianChartInteractionProps,
	type ChartAccessibleName,
	type ChartAnimation,
	type ChartDatum,
	type ChartMode,
	type ChartSeries,
	type ChartStateProps,
	chartAccessibleName,
	chartColor,
	chartTickValue,
	chartXAxisInterval,
	numericValue,
	resolveChartMode,
} from "../internal/chart-types.js";
import "./bar-chart.css";

export type BarChartOrientation = "vertical" | "horizontal";

export type BarChartProps<TDatum extends ChartDatum> = ChartAccessibleName &
	ChartStateProps &
	CartesianChartInteractionProps<TDatum> & {
		readonly animation?: ChartAnimation;
		readonly barCategoryGap?: number | string;
		readonly data: readonly TDatum[];
		readonly index: Extract<keyof TDatum, string>;
		readonly mode?: ChartMode;
		readonly orientation?: BarChartOrientation;
		readonly series: readonly ChartSeries<TDatum>[];
		readonly showGrid?: boolean;
		readonly showLabels?: boolean;
		readonly showLegend?: boolean;
		readonly showTooltip?: boolean;
		/** @deprecated Use mode="stacked". */
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

/** Grouped, stacked, or percent bar chart in both orientations. */
export function BarChart<TDatum extends ChartDatum>({
	animation = "auto",
	barCategoryGap,
	className,
	data,
	emptyMessage,
	error,
	height = 320,
	index,
	legendOverflow = "wrap",
	legendPosition = "right",
	loading,
	mode,
	onRetry,
	onTooltipChange,
	onValueChange,
	orientation = "vertical",
	renderTooltip,
	series,
	showGrid = true,
	showLabels = false,
	showLegend = true,
	showTooltip = true,
	stacked,
	style,
	xAxis,
	yAxis,
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledBy,
}: BarChartProps<TDatum>): ReactElement {
	const [hiddenSeries, toggleSeries] = useChartSeriesVisibility();
	const selection = useChartSelection(series, onValueChange);
	const animationActive = useChartAnimation(
		animation,
		data.length * series.length,
	);
	const labelsVisible = barChartLabelsAreVisible(data, series, showLabels);
	const resolvedMode = resolveChartMode(mode, stacked);
	const xAxisOptions = xAxis === false ? { show: false } : (xAxis ?? {});
	const yAxisOptions = yAxis === false ? { show: false } : (yAxis ?? {});
	const legendItems = series.map((item, seriesIndex) => ({
		color: chartColor(item.color, seriesIndex),
		id: item.dataKey,
		name: item.name,
	}));
	const frameName = chartAccessibleName(ariaLabel, ariaLabelledBy);
	const horizontal = orientation === "horizontal";
	const endDatum = data[data.length - 1];
	const startEndTicks =
		xAxisOptions.startEndOnly && data[0] && endDatum
			? [chartTickValue(data[0][index]), chartTickValue(endDatum[index])]
			: undefined;
	const valueDomain: [number | "dataMin", number | "auto"] = [
		yAxisOptions.min ?? (yAxisOptions.autoMin ? "dataMin" : 0),
		yAxisOptions.max ?? "auto",
	];
	const percent = resolvedMode === "percent";
	const percentFormatter = (value: number): string =>
		`${Math.round(value * 100)}%`;

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
			legendOverflow={legendOverflow}
			legendPosition={legendPosition}
			loading={loading}
			onRetry={onRetry}
			onToggleSeries={showLegend ? toggleSeries : undefined}
			style={style}
			summary={`${data.length} categories across ${series.length} ${resolvedMode === "stacked" ? "stacked " : resolvedMode === "percent" ? "percent " : ""}${orientation} bar series: ${series.map((item) => item.name).join(", ")}.`}
		>
			<ResponsiveContainer height="100%" width="100%">
				<RechartsBarChart
					accessibilityLayer
					barCategoryGap={barCategoryGap}
					data={data}
					layout={horizontal ? "vertical" : "horizontal"}
					margin={{
						bottom: xAxisOptions.label ? 28 : 8,
						left: horizontal ? 12 : yAxisOptions.label ? 20 : 4,
						right: horizontal && yAxisOptions.label ? 20 : 12,
						top: labelsVisible ? 24 : 8,
					}}
					onClick={selection.selected ? selection.clear : undefined}
					stackOffset={percent ? "expand" : undefined}
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
								allowDecimals={yAxisOptions.allowDecimals ?? true}
								axisLine={false}
								domain={valueDomain}
								hide={xAxisOptions.show === false}
								stroke="var(--chart-axis)"
								tickFormatter={
									percent ? percentFormatter : yAxisOptions.valueFormatter
								}
								tickLine={false}
								type="number"
							>
								{xAxisOptions.label ? (
									<Label offset={-20} position="insideBottom">
										{xAxisOptions.label}
									</Label>
								) : null}
							</XAxis>
							<YAxis
								axisLine={false}
								dataKey={index}
								hide={yAxisOptions.show === false}
								interval={chartXAxisInterval(xAxisOptions.interval)}
								minTickGap={xAxisOptions.tickGap ?? 5}
								stroke="var(--chart-axis)"
								tickLine={false}
								type="category"
								width={yAxisOptions.width ?? 88}
							>
								{yAxisOptions.label ? (
									<Label angle={-90} position="insideLeft">
										{yAxisOptions.label}
									</Label>
								) : null}
							</YAxis>
						</>
					) : (
						<>
							<XAxis
								axisLine={false}
								dataKey={index}
								hide={xAxisOptions.show === false}
								interval={chartXAxisInterval(xAxisOptions.interval)}
								minTickGap={xAxisOptions.tickGap ?? 5}
								stroke="var(--chart-axis)"
								tickLine={false}
								ticks={startEndTicks}
								type="category"
							>
								{xAxisOptions.label ? (
									<Label offset={-20} position="insideBottom">
										{xAxisOptions.label}
									</Label>
								) : null}
							</XAxis>
							<YAxis
								allowDecimals={yAxisOptions.allowDecimals ?? true}
								axisLine={false}
								domain={valueDomain}
								hide={yAxisOptions.show === false}
								stroke="var(--chart-axis)"
								tickFormatter={
									percent ? percentFormatter : yAxisOptions.valueFormatter
								}
								tickLine={false}
								type="number"
								width={yAxisOptions.width ?? 56}
							>
								{yAxisOptions.label ? (
									<Label angle={-90} position="insideLeft">
										{yAxisOptions.label}
									</Label>
								) : null}
							</YAxis>
						</>
					)}
					<Tooltip
						content={(props) => (
							<ChartTooltipContent
								active={showTooltip ? props.active : false}
								label={props.label}
								onChange={onTooltipChange}
								payload={props.payload}
								render={renderTooltip}
								series={series}
							/>
						)}
						cursor={{ fill: "var(--chart-cursor)" }}
						isAnimationActive={animationActive}
					/>
					{series.map((item, seriesIndex) => {
						const dimmed =
							selection.selected !== null &&
							selection.selected.dataKey !== item.dataKey;
						return (
							<Bar
								dataKey={item.dataKey}
								fill={chartColor(item.color, seriesIndex)}
								fillOpacity={dimmed ? 0.3 : 1}
								hide={hiddenSeries.has(item.dataKey)}
								isAnimationActive={animationActive}
								key={item.dataKey}
								name={item.name}
								onClick={
									onValueChange
										? (
												point,
												_pointIndex,
												event: MouseEvent<SVGPathElement>,
											) => {
												event.stopPropagation();
												if (!point.payload) return;
												selection.select(
													item.dataKey,
													point.payload as TDatum,
													String((point.payload as TDatum)[index]),
												);
											}
										: undefined
								}
								radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
								stackId={resolvedMode === "default" ? undefined : "bar-stack"}
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
						);
					})}
				</RechartsBarChart>
			</ResponsiveContainer>
		</ChartVisualizationFrame>
	);
}

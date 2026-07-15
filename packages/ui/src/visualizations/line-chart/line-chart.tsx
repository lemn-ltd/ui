import type { MouseEvent, ReactElement } from "react";
import {
	CartesianGrid,
	Dot,
	Label,
	Line,
	LineChart as RechartsLineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
	type ActiveDotProps,
	type DotProps,
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
	type ChartSeries,
	type ChartStateProps,
	chartAccessibleName,
	chartColor,
	chartTickValue,
	chartXAxisInterval,
} from "../internal/chart-types.js";
import "./line-chart.css";

export type LineChartCurve = "linear" | "monotone" | "step";

export type LineChartProps<TDatum extends ChartDatum> = ChartAccessibleName &
	ChartStateProps &
	CartesianChartInteractionProps<TDatum> & {
		readonly animation?: ChartAnimation;
		readonly connectNulls?: boolean;
		readonly curve?: LineChartCurve;
		readonly data: readonly TDatum[];
		readonly index: Extract<keyof TDatum, string>;
		readonly series: readonly ChartSeries<TDatum>[];
		readonly showDots?: boolean;
		readonly showGrid?: boolean;
		readonly showLegend?: boolean;
		readonly showTooltip?: boolean;
	};

/** Responsive multi-series line chart with selection and configurable axes. */
export function LineChart<TDatum extends ChartDatum>({
	animation = "auto",
	className,
	connectNulls = false,
	curve = "monotone",
	data,
	emptyMessage,
	error,
	height = 320,
	index,
	legendOverflow = "wrap",
	legendPosition = "right",
	loading,
	onRetry,
	onTooltipChange,
	onValueChange,
	renderTooltip,
	series,
	showDots = false,
	showGrid = true,
	showLegend = true,
	showTooltip = true,
	style,
	xAxis,
	yAxis,
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledBy,
}: LineChartProps<TDatum>): ReactElement {
	const [hiddenSeries, toggleSeries] = useChartSeriesVisibility();
	const selection = useChartSelection(series, onValueChange);
	const animationActive = useChartAnimation(
		animation,
		data.length * series.length,
	);
	const xAxisOptions = xAxis === false ? { show: false } : (xAxis ?? {});
	const yAxisOptions = yAxis === false ? { show: false } : (yAxis ?? {});
	const legendItems = series.map((item, seriesIndex) => ({
		color: chartColor(item.color, seriesIndex),
		id: item.dataKey,
		name: item.name,
	}));
	const frameName = chartAccessibleName(ariaLabel, ariaLabelledBy);
	const endDatum = data[data.length - 1];
	const startEndTicks =
		xAxisOptions.startEndOnly && data[0] && endDatum
			? [chartTickValue(data[0][index]), chartTickValue(endDatum[index])]
			: undefined;
	const yDomain: [number | "dataMin", number | "auto"] = [
		yAxisOptions.min ?? (yAxisOptions.autoMin ? "dataMin" : 0),
		yAxisOptions.max ?? "auto",
	];

	return (
		<ChartVisualizationFrame
			{...frameName}
			animationActive={animationActive}
			className={["ui-line-chart", className].filter(Boolean).join(" ")}
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
			summary={`${data.length} data points across ${series.length} line series: ${series.map((item) => item.name).join(", ")}.`}
		>
			<ResponsiveContainer height="100%" width="100%">
				<RechartsLineChart
					accessibilityLayer
					data={data}
					margin={{
						bottom: xAxisOptions.label ? 28 : 8,
						left: yAxisOptions.label ? 20 : 4,
						right: 12,
						top: 8,
					}}
					onClick={selection.selected ? selection.clear : undefined}
				>
					{showGrid ? (
						<CartesianGrid
							stroke="var(--lemn-chart-grid)"
							strokeDasharray="3 3"
							vertical={false}
						/>
					) : null}
					<XAxis
						axisLine={false}
						dataKey={index}
						hide={xAxisOptions.show === false}
						interval={chartXAxisInterval(xAxisOptions.interval)}
						minTickGap={xAxisOptions.tickGap ?? 5}
						stroke="var(--lemn-chart-axis)"
						tickLine={false}
						ticks={startEndTicks}
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
						domain={yDomain}
						hide={yAxisOptions.show === false}
						stroke="var(--lemn-chart-axis)"
						tickFormatter={yAxisOptions.valueFormatter}
						tickLine={false}
						width={yAxisOptions.width ?? 56}
					>
						{yAxisOptions.label ? (
							<Label angle={-90} position="insideLeft">
								{yAxisOptions.label}
							</Label>
						) : null}
					</YAxis>
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
						cursor={{ stroke: "var(--lemn-chart-cursor)" }}
						isAnimationActive={animationActive}
					/>
					{series.map((item, seriesIndex) => {
						const dimmed =
							selection.selected !== null &&
							selection.selected.dataKey !== item.dataKey;
						return (
							<Line
								activeDot={
									onValueChange
										? (point: ActiveDotProps) => (
												<Dot
													{...point}
													className="ui-chart-selectable-mark"
													onClick={(
														_dotProps: DotProps,
														event: MouseEvent<SVGCircleElement>,
													) => {
														event.stopPropagation();
														selection.select(
															item.dataKey,
															point.payload as TDatum,
															String((point.payload as TDatum)[index]),
														);
													}}
													r={5}
												/>
											)
										: { r: 4 }
								}
								connectNulls={connectNulls}
								dataKey={item.dataKey}
								dot={showDots}
								hide={hiddenSeries.has(item.dataKey)}
								isAnimationActive={animationActive}
								key={item.dataKey}
								name={item.name}
								stroke={chartColor(item.color, seriesIndex)}
								strokeOpacity={dimmed ? 0.3 : 1}
								strokeWidth={2}
								type={curve}
							/>
						);
					})}
				</RechartsLineChart>
			</ResponsiveContainer>
		</ChartVisualizationFrame>
	);
}

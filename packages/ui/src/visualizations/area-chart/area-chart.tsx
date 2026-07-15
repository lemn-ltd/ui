import type { MouseEvent, ReactElement } from "react";
import { useId } from "react";
import {
	Area,
	CartesianGrid,
	Dot,
	Label,
	AreaChart as RechartsAreaChart,
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
	type ChartMode,
	type ChartSeries,
	type ChartStateProps,
	chartAccessibleName,
	chartColor,
	chartTickValue,
	chartXAxisInterval,
	resolveChartMode,
} from "../internal/chart-types.js";
import "./area-chart.css";

export type AreaChartFill = "solid" | "gradient" | "none";

export type AreaChartProps<TDatum extends ChartDatum> = ChartAccessibleName &
	ChartStateProps &
	CartesianChartInteractionProps<TDatum> & {
		readonly animation?: ChartAnimation;
		readonly connectNulls?: boolean;
		readonly data: readonly TDatum[];
		readonly fill?: AreaChartFill;
		readonly index: Extract<keyof TDatum, string>;
		readonly mode?: ChartMode;
		readonly series: readonly ChartSeries<TDatum>[];
		readonly showGrid?: boolean;
		readonly showLegend?: boolean;
		readonly showTooltip?: boolean;
		/** @deprecated Use mode="stacked". */
		readonly stacked?: boolean;
	};

/** Responsive area chart for one or more normal, stacked, or percent series. */
export function AreaChart<TDatum extends ChartDatum>({
	animation = "auto",
	className,
	connectNulls = false,
	data,
	emptyMessage,
	error,
	fill = "gradient",
	height = 320,
	index,
	legendOverflow = "wrap",
	legendPosition = "right",
	loading,
	mode,
	onRetry,
	onTooltipChange,
	onValueChange,
	renderTooltip,
	series,
	showGrid = true,
	showLegend = true,
	showTooltip = true,
	stacked,
	style,
	xAxis,
	yAxis,
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledBy,
}: AreaChartProps<TDatum>): ReactElement {
	const gradientSeed = useId().replaceAll(":", "");
	const animationActive = useChartAnimation(
		animation,
		data.length * series.length,
	);
	const [hiddenSeries, toggleSeries] = useChartSeriesVisibility();
	const selection = useChartSelection(series, onValueChange);
	const resolvedMode = resolveChartMode(mode, stacked);
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
	const percent = resolvedMode === "percent";
	const percentFormatter = (value: number): string =>
		`${Math.round(value * 100)}%`;

	return (
		<ChartVisualizationFrame
			{...frameName}
			animationActive={animationActive}
			className={["ui-area-chart", className].filter(Boolean).join(" ")}
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
			summary={`${data.length} data points across ${series.length} ${resolvedMode === "stacked" ? "stacked " : resolvedMode === "percent" ? "percent " : ""}area series: ${series.map((item) => item.name).join(", ")}.`}
		>
			<ResponsiveContainer height="100%" width="100%">
				<RechartsAreaChart
					accessibilityLayer
					data={data}
					margin={{
						bottom: xAxisOptions.label ? 28 : 8,
						left: yAxisOptions.label ? 20 : 4,
						right: 12,
						top: 8,
					}}
					onClick={selection.selected ? selection.clear : undefined}
					stackOffset={percent ? "expand" : undefined}
				>
					<defs>
						{series.map((item, seriesIndex) => {
							const color = chartColor(item.color, seriesIndex);
							return (
								<linearGradient
									id={`${gradientSeed}-${seriesIndex}`}
									key={item.dataKey}
									x1="0"
									x2="0"
									y1="0"
									y2="1"
								>
									<stop offset="5%" stopColor={color} stopOpacity={0.45} />
									<stop offset="95%" stopColor={color} stopOpacity={0.04} />
								</linearGradient>
							);
						})}
					</defs>
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
						tickFormatter={
							percent ? percentFormatter : yAxisOptions.valueFormatter
						}
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
						const color = chartColor(item.color, seriesIndex);
						const dimmed =
							selection.selected !== null &&
							selection.selected.dataKey !== item.dataKey;
						return (
							<Area
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
								fill={
									fill === "none"
										? "transparent"
										: fill === "gradient"
											? `url(#${gradientSeed}-${seriesIndex})`
											: color
								}
								fillOpacity={fill === "solid" ? (dimmed ? 0.06 : 0.18) : 1}
								hide={hiddenSeries.has(item.dataKey)}
								isAnimationActive={animationActive}
								key={item.dataKey}
								name={item.name}
								stackId={resolvedMode === "default" ? undefined : "area-stack"}
								stroke={color}
								strokeOpacity={dimmed ? 0.3 : 1}
								strokeWidth={2}
								type="monotone"
							/>
						);
					})}
				</RechartsAreaChart>
			</ResponsiveContainer>
		</ChartVisualizationFrame>
	);
}

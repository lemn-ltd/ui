import type { MouseEvent, ReactElement } from "react";
import {
	Bar,
	CartesianGrid,
	ComposedChart,
	Dot,
	Label,
	Line,
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
	type ChartYAxisOptions,
	chartAccessibleName,
	chartColor,
	chartTickValue,
	chartXAxisInterval,
} from "../internal/chart-types.js";
import "./combo-chart.css";

export interface ComboChartSeries<TDatum extends ChartDatum>
	extends ChartSeries<TDatum> {
	readonly axis?: "primary" | "secondary";
	readonly connectNulls?: boolean;
	readonly kind: "bar" | "line";
	readonly stackId?: string;
}

export type ComboChartProps<TDatum extends ChartDatum> = ChartAccessibleName &
	ChartStateProps &
	CartesianChartInteractionProps<TDatum> & {
		readonly animation?: ChartAnimation;
		readonly barCategoryGap?: number | string;
		readonly barMode?: "default" | "stacked";
		readonly data: readonly TDatum[];
		readonly enableBiaxial?: boolean;
		readonly index: Extract<keyof TDatum, string>;
		readonly secondaryYAxis?: ChartYAxisOptions | false;
		readonly series: readonly ComboChartSeries<TDatum>[];
		readonly showGrid?: boolean;
		readonly showLegend?: boolean;
		readonly showTooltip?: boolean;
	};

/** Composes declared bar and line series without exposing arbitrary renderers. */
export function ComboChart<TDatum extends ChartDatum>({
	animation = "auto",
	barCategoryGap,
	barMode = "default",
	className,
	data,
	emptyMessage,
	enableBiaxial,
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
	secondaryYAxis,
	series,
	showGrid = true,
	showLegend = true,
	showTooltip = true,
	style,
	xAxis,
	yAxis,
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledBy,
}: ComboChartProps<TDatum>): ReactElement {
	const [hiddenSeries, toggleSeries] = useChartSeriesVisibility();
	const selection = useChartSelection(series, onValueChange);
	const animationActive = useChartAnimation(
		animation,
		data.length * series.length,
	);
	const xAxisOptions = xAxis === false ? { show: false } : (xAxis ?? {});
	const yAxisOptions = yAxis === false ? { show: false } : (yAxis ?? {});
	const secondaryAxisOptions =
		secondaryYAxis === false
			? { show: false }
			: (secondaryYAxis ?? yAxisOptions);
	const legendItems = series.map((item, seriesIndex) => ({
		color: chartColor(item.color, seriesIndex),
		id: item.dataKey,
		name: item.name,
	}));
	const declaresSecondaryAxis = series.some(
		(item) => item.axis === "secondary",
	);
	const hasSecondaryAxis = enableBiaxial ?? declaresSecondaryAxis;
	const frameName = chartAccessibleName(ariaLabel, ariaLabelledBy);
	const endDatum = data[data.length - 1];
	const startEndTicks =
		xAxisOptions.startEndOnly && data[0] && endDatum
			? [chartTickValue(data[0][index]), chartTickValue(endDatum[index])]
			: undefined;
	const primaryDomain: [number | "dataMin", number | "auto"] = [
		yAxisOptions.min ?? (yAxisOptions.autoMin ? "dataMin" : 0),
		yAxisOptions.max ?? "auto",
	];
	const secondaryDomain: [number | "dataMin", number | "auto"] = [
		secondaryAxisOptions.min ?? (secondaryAxisOptions.autoMin ? "dataMin" : 0),
		secondaryAxisOptions.max ?? "auto",
	];

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
			legendOverflow={legendOverflow}
			legendPosition={legendPosition}
			loading={loading}
			onRetry={onRetry}
			onToggleSeries={showLegend ? toggleSeries : undefined}
			style={style}
			summary={`${data.length} data points combining ${series.filter((item) => item.kind === "bar").length} bar and ${series.filter((item) => item.kind === "line").length} line series.`}
		>
			<ResponsiveContainer height="100%" width="100%">
				<ComposedChart
					accessibilityLayer
					barCategoryGap={barCategoryGap}
					data={data}
					margin={{
						bottom: xAxisOptions.label ? 28 : 8,
						left: yAxisOptions.label ? 20 : 4,
						right: hasSecondaryAxis && secondaryAxisOptions.label ? 20 : 12,
						top: 8,
					}}
					onClick={selection.selected ? selection.clear : undefined}
				>
					{showGrid ? (
						<CartesianGrid
							stroke="var(--chart-grid)"
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
						stroke="var(--chart-axis)"
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
						domain={primaryDomain}
						hide={yAxisOptions.show === false}
						stroke="var(--chart-axis)"
						tickFormatter={yAxisOptions.valueFormatter}
						tickLine={false}
						width={yAxisOptions.width ?? 56}
						yAxisId="primary"
					>
						{yAxisOptions.label ? (
							<Label angle={-90} position="insideLeft">
								{yAxisOptions.label}
							</Label>
						) : null}
					</YAxis>
					{hasSecondaryAxis ? (
						<YAxis
							allowDecimals={secondaryAxisOptions.allowDecimals ?? true}
							axisLine={false}
							domain={secondaryDomain}
							hide={secondaryAxisOptions.show === false}
							orientation="right"
							stroke="var(--chart-axis)"
							tickFormatter={secondaryAxisOptions.valueFormatter}
							tickLine={false}
							width={secondaryAxisOptions.width ?? 56}
							yAxisId="secondary"
						>
							{secondaryAxisOptions.label ? (
								<Label angle={90} position="insideRight">
									{secondaryAxisOptions.label}
								</Label>
							) : null}
						</YAxis>
					) : null}
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
						const yAxisId =
							hasSecondaryAxis && item.axis === "secondary"
								? "secondary"
								: "primary";
						const dimmed =
							selection.selected !== null &&
							selection.selected.dataKey !== item.dataKey;
						const shared = {
							dataKey: item.dataKey,
							hide: hiddenSeries.has(item.dataKey),
							isAnimationActive: animationActive,
							name: item.name,
							yAxisId,
						};
						const color = chartColor(item.color, seriesIndex);
						return item.kind === "bar" ? (
							<Bar
								{...shared}
								fill={color}
								fillOpacity={dimmed ? 0.3 : 1}
								key={item.dataKey}
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
								radius={[4, 4, 0, 0]}
								stackId={
									item.stackId ??
									(barMode === "stacked" ? "combo-bar-stack" : undefined)
								}
							/>
						) : (
							<Line
								{...shared}
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
								connectNulls={item.connectNulls}
								dot={false}
								key={item.dataKey}
								stroke={color}
								strokeOpacity={dimmed ? 0.3 : 1}
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

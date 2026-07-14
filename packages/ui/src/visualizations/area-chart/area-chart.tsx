import { type ReactElement, useId } from "react";
import {
	Area,
	CartesianGrid,
	AreaChart as RechartsAreaChart,
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
import "./area-chart.css";

export type AreaChartFill = "solid" | "gradient";

export type AreaChartProps<TDatum extends ChartDatum> = ChartAccessibleName &
	ChartStateProps & {
		readonly animation?: ChartAnimation;
		readonly data: readonly TDatum[];
		readonly fill?: AreaChartFill;
		readonly index: Extract<keyof TDatum, string>;
		readonly series: readonly ChartSeries<TDatum>[];
		readonly showGrid?: boolean;
		readonly showLegend?: boolean;
		readonly showTooltip?: boolean;
		readonly stacked?: boolean;
	};

/** Responsive area chart for one or more normal or stacked series. */
export function AreaChart<TDatum extends ChartDatum>({
	animation = "auto",
	className,
	data,
	emptyMessage,
	error,
	fill = "gradient",
	height = 320,
	index,
	loading,
	onRetry,
	series,
	showGrid = true,
	showLegend = true,
	showTooltip = true,
	stacked = false,
	style,
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledBy,
}: AreaChartProps<TDatum>): ReactElement {
	const gradientSeed = useId().replaceAll(":", "");
	const animationActive = useChartAnimation(
		animation,
		data.length * series.length,
	);
	const [hiddenSeries, toggleSeries] = useChartSeriesVisibility();
	const legendItems = series.map((item, seriesIndex) => ({
		color: chartColor(item.color, seriesIndex),
		id: item.dataKey,
		name: item.name,
	}));
	const frameName = chartAccessibleName(ariaLabel, ariaLabelledBy);

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
			loading={loading}
			onRetry={onRetry}
			onToggleSeries={showLegend ? toggleSeries : undefined}
			style={style}
			summary={`${data.length} data points across ${series.length} ${stacked ? "stacked " : ""}area series: ${series.map((item) => item.name).join(", ")}.`}
		>
			<ResponsiveContainer height="100%" width="100%">
				<RechartsAreaChart
					accessibilityLayer
					data={data}
					margin={{ bottom: 8, left: 4, right: 12, top: 8 }}
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
							stroke="var(--chart-grid)"
							strokeDasharray="3 3"
							vertical={false}
						/>
					) : null}
					<XAxis dataKey={index} stroke="var(--chart-axis)" tickLine={false} />
					<YAxis stroke="var(--chart-axis)" tickLine={false} width={44} />
					{showTooltip ? (
						<Tooltip
							contentStyle={{
								background: "var(--chart-tooltip-surface)",
								border: "1px solid var(--chart-tooltip-border)",
								borderRadius: "var(--radius-sm)",
								color: "var(--text)",
							}}
							cursor={{ stroke: "var(--chart-cursor)" }}
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
						const color = chartColor(item.color, seriesIndex);
						return (
							<Area
								dataKey={item.dataKey}
								fill={
									fill === "gradient"
										? `url(#${gradientSeed}-${seriesIndex})`
										: color
								}
								fillOpacity={fill === "gradient" ? 1 : 0.18}
								hide={hiddenSeries.has(item.dataKey)}
								isAnimationActive={animationActive}
								key={item.dataKey}
								name={item.name}
								stackId={stacked ? "area-stack" : undefined}
								stroke={color}
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

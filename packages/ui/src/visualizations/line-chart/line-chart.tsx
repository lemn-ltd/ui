import type { ReactElement } from "react";
import {
	CartesianGrid,
	Line,
	LineChart as RechartsLineChart,
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
import "./line-chart.css";

export type LineChartCurve = "linear" | "monotone" | "step";

export type LineChartProps<TDatum extends ChartDatum> = ChartAccessibleName &
	ChartStateProps & {
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

/** Responsive multi-series line chart with keyboard-aware interaction semantics. */
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
	loading,
	onRetry,
	series,
	showDots = false,
	showGrid = true,
	showLegend = true,
	showTooltip = true,
	style,
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledBy,
}: LineChartProps<TDatum>): ReactElement {
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
	const frameName = chartAccessibleName(ariaLabel, ariaLabelledBy);

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
					margin={{ bottom: 8, left: 4, right: 12, top: 8 }}
				>
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
								const formatted =
									number !== undefined && matchingSeries?.valueFormatter
										? matchingSeries.valueFormatter(number)
										: String(value ?? "—");
								return [formatted, matchingSeries?.name ?? String(name)];
							}}
						/>
					) : null}
					{series.map((item, seriesIndex) => (
						<Line
							connectNulls={connectNulls}
							dataKey={item.dataKey}
							dot={showDots}
							hide={hiddenSeries.has(item.dataKey)}
							isAnimationActive={animationActive}
							key={item.dataKey}
							name={item.name}
							stroke={chartColor(item.color, seriesIndex)}
							strokeWidth={2}
							type={curve}
						/>
					))}
				</RechartsLineChart>
			</ResponsiveContainer>
		</ChartVisualizationFrame>
	);
}

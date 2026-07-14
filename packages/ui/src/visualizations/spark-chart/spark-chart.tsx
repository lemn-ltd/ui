import type { ReactElement } from "react";
import {
	Area,
	Bar,
	ComposedChart,
	Line,
	ResponsiveContainer,
	Tooltip,
} from "recharts";
import { ChartVisualizationFrame } from "../internal/chart-a11y.js";
import { useChartAnimation } from "../internal/chart-animation.js";
import {
	type ChartAccessibleName,
	type ChartAnimation,
	type ChartColor,
	type ChartDatum,
	type ChartStateProps,
	chartAccessibleName,
	chartColor,
} from "../internal/chart-types.js";
import "./spark-chart.css";

export type SparkChartKind = "line" | "area" | "bar";

export type SparkChartProps<TDatum extends ChartDatum> = ChartAccessibleName &
	ChartStateProps & {
		readonly animation?: ChartAnimation;
		readonly color?: ChartColor;
		readonly data: readonly TDatum[];
		readonly dataKey: Extract<keyof TDatum, string>;
		readonly index: Extract<keyof TDatum, string>;
		readonly kind?: SparkChartKind;
		readonly name: string;
		readonly showTooltip?: boolean;
		readonly valueFormatter?: (value: number) => string;
	};

/** Compact interactive line, area, or bar chart for dense report surfaces. */
export function SparkChart<TDatum extends ChartDatum>({
	animation = "auto",
	className,
	color,
	data,
	dataKey,
	emptyMessage,
	error,
	height = 96,
	index,
	kind = "line",
	loading,
	name,
	onRetry,
	showTooltip = true,
	style,
	valueFormatter = (value) => String(value),
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledBy,
}: SparkChartProps<TDatum>): ReactElement {
	const resolvedColor = chartColor(color, 0);
	const animationActive = useChartAnimation(animation, data.length);
	const frameName = chartAccessibleName(ariaLabel, ariaLabelledBy);
	const shared = {
		dataKey,
		isAnimationActive: animationActive,
		name,
	};

	return (
		<ChartVisualizationFrame
			{...frameName}
			animationActive={animationActive}
			className={["ui-spark-chart", className].filter(Boolean).join(" ")}
			dataLength={data.length}
			emptyMessage={emptyMessage}
			error={error}
			height={height}
			loading={loading}
			onRetry={onRetry}
			style={style}
			summary={`${name} compact ${kind} chart with ${data.length} data points.`}
		>
			<ResponsiveContainer height="100%" width="100%">
				<ComposedChart
					accessibilityLayer
					data={data}
					margin={{ bottom: 2, left: 2, right: 2, top: 2 }}
				>
					{kind === "line" ? (
						<Line
							{...shared}
							dot={false}
							stroke={resolvedColor}
							strokeWidth={2}
							type="monotone"
						/>
					) : null}
					{kind === "area" ? (
						<Area
							{...shared}
							fill={resolvedColor}
							fillOpacity={0.16}
							stroke={resolvedColor}
							strokeWidth={2}
							type="monotone"
						/>
					) : null}
					{kind === "bar" ? (
						<Bar {...shared} fill={resolvedColor} radius={[2, 2, 0, 0]} />
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
							formatter={(value) => [
								typeof value === "number"
									? valueFormatter(value)
									: String(value ?? "—"),
								name,
							]}
							labelFormatter={(_, payload) => {
								const datum = payload[0]?.payload;
								return datum && typeof datum === "object" && index in datum
									? String(datum[index])
									: "";
							}}
						/>
					) : null}
				</ComposedChart>
			</ResponsiveContainer>
		</ChartVisualizationFrame>
	);
}

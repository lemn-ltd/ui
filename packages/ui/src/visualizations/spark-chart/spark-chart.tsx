import { type ReactElement, type ReactNode, useId } from "react";
import {
	Area,
	Bar,
	ComposedChart,
	Line,
	ResponsiveContainer,
	Tooltip,
	YAxis,
} from "recharts";
import { ChartVisualizationFrame } from "../internal/chart-a11y.js";
import { useChartAnimation } from "../internal/chart-animation.js";
import { ChartTooltipContent } from "../internal/chart-tooltip.js";
import {
	type ChartAccessibleName,
	type ChartAnimation,
	type ChartColor,
	type ChartDatum,
	type ChartMode,
	type ChartSeries,
	type ChartStateProps,
	type ChartTooltipContext,
	type ChartValueDomain,
	chartAccessibleName,
	chartColor,
	resolveChartMode,
} from "../internal/chart-types.js";
import "./spark-chart.css";

export type SparkChartKind = "line" | "area" | "bar";
export type SparkChartFill = "solid" | "gradient" | "none";

type SparkChartSeriesInput<TDatum extends ChartDatum> =
	| {
			readonly color?: never;
			readonly dataKey?: never;
			readonly name?: never;
			readonly series: readonly ChartSeries<TDatum>[];
			readonly valueFormatter?: never;
	  }
	| {
			readonly color?: ChartColor;
			readonly dataKey: Extract<keyof TDatum, string>;
			readonly name: string;
			readonly series?: never;
			readonly valueFormatter?: (value: number) => string;
	  };

export type SparkChartProps<TDatum extends ChartDatum> = ChartAccessibleName &
	ChartStateProps &
	SparkChartSeriesInput<TDatum> & {
		readonly animation?: ChartAnimation;
		readonly barCategoryGap?: number | string;
		readonly connectNulls?: boolean;
		readonly data: readonly TDatum[];
		readonly domain?: ChartValueDomain;
		readonly fill?: SparkChartFill;
		readonly index: Extract<keyof TDatum, string>;
		readonly kind?: SparkChartKind;
		readonly mode?: ChartMode;
		readonly onTooltipChange?: (
			context: ChartTooltipContext<TDatum> | null,
		) => void;
		readonly renderTooltip?: (
			context: ChartTooltipContext<TDatum>,
		) => ReactNode;
		readonly showTooltip?: boolean;
	};

/** Compact multi-series line, area, or bar chart for dense report surfaces. */
export function SparkChart<TDatum extends ChartDatum>({
	animation = "auto",
	barCategoryGap,
	className,
	color,
	connectNulls = false,
	data,
	dataKey,
	domain,
	emptyMessage,
	error,
	fill = "solid",
	height = 96,
	index,
	kind = "line",
	loading,
	mode = "default",
	name,
	onRetry,
	onTooltipChange,
	renderTooltip,
	series,
	showTooltip = true,
	style,
	valueFormatter,
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledBy,
}: SparkChartProps<TDatum>): ReactElement {
	const gradientSeed = useId().replaceAll(":", "");
	const resolvedSeries: readonly ChartSeries<TDatum>[] =
		series ??
		(dataKey && name
			? [{ color, dataKey, name, valueFormatter }]
			: ([] as readonly ChartSeries<TDatum>[]));
	const animationActive = useChartAnimation(
		animation,
		data.length * resolvedSeries.length,
	);
	const frameName = chartAccessibleName(ariaLabel, ariaLabelledBy);
	const resolvedMode = resolveChartMode(mode, false);
	const valueDomain: [number | "dataMin", number | "auto"] = [
		domain?.min ?? (domain?.autoMin ? "dataMin" : 0),
		domain?.max ?? "auto",
	];

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
			summary={`${resolvedSeries.map((item) => item.name).join(", ")} compact ${kind} chart with ${data.length} data points.`}
		>
			<ResponsiveContainer height="100%" width="100%">
				<ComposedChart
					accessibilityLayer
					barCategoryGap={barCategoryGap}
					data={data}
					margin={{ bottom: 2, left: 2, right: 2, top: 2 }}
					stackOffset={resolvedMode === "percent" ? "expand" : undefined}
				>
					<defs>
						{resolvedSeries.map((item, seriesIndex) => {
							const resolvedColor = chartColor(item.color, seriesIndex);
							return (
								<linearGradient
									id={`${gradientSeed}-${seriesIndex}`}
									key={item.dataKey}
									x1="0"
									x2="0"
									y1="0"
									y2="1"
								>
									<stop
										offset="5%"
										stopColor={resolvedColor}
										stopOpacity={0.35}
									/>
									<stop
										offset="95%"
										stopColor={resolvedColor}
										stopOpacity={0.02}
									/>
								</linearGradient>
							);
						})}
					</defs>
					<YAxis domain={valueDomain} hide />
					{resolvedSeries.map((item, seriesIndex) => {
						const resolvedColor = chartColor(item.color, seriesIndex);
						const shared = {
							dataKey: item.dataKey,
							isAnimationActive: animationActive,
							name: item.name,
						};
						if (kind === "line") {
							return (
								<Line
									{...shared}
									connectNulls={connectNulls}
									dot={false}
									key={item.dataKey}
									stroke={resolvedColor}
									strokeWidth={2}
									type="monotone"
								/>
							);
						}
						if (kind === "area") {
							return (
								<Area
									{...shared}
									connectNulls={connectNulls}
									fill={
										fill === "none"
											? "transparent"
											: fill === "gradient"
												? `url(#${gradientSeed}-${seriesIndex})`
												: resolvedColor
									}
									fillOpacity={fill === "solid" ? 0.16 : 1}
									key={item.dataKey}
									stackId={
										resolvedMode === "default" ? undefined : "spark-stack"
									}
									stroke={resolvedColor}
									strokeWidth={2}
									type="monotone"
								/>
							);
						}
						return (
							<Bar
								{...shared}
								fill={resolvedColor}
								key={item.dataKey}
								radius={[2, 2, 0, 0]}
								stackId={resolvedMode === "default" ? undefined : "spark-stack"}
							/>
						);
					})}
					<Tooltip
						content={(props) => (
							<ChartTooltipContent
								active={showTooltip ? props.active : false}
								label={props.label}
								onChange={onTooltipChange}
								payload={props.payload}
								render={renderTooltip}
								series={resolvedSeries}
							/>
						)}
						cursor={{ fill: "var(--lemn-chart-cursor)" }}
						isAnimationActive={animationActive}
						labelFormatter={(_, payload) => {
							const datum = payload[0]?.payload;
							return datum && typeof datum === "object" && index in datum
								? String(datum[index])
								: "";
						}}
					/>
				</ComposedChart>
			</ResponsiveContainer>
		</ChartVisualizationFrame>
	);
}

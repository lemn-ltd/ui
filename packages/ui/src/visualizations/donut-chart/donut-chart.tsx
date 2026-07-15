import {
	type MouseEvent,
	type ReactElement,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	type PieSectorDataItem,
} from "recharts";
import { ChartVisualizationFrame } from "../internal/chart-a11y.js";
import { useChartAnimation } from "../internal/chart-animation.js";
import { useChartSeriesVisibility } from "../internal/chart-legend.js";
import {
	type ChartAccessibleName,
	type ChartAnimation,
	type ChartColor,
	type ChartLegendOverflow,
	type ChartLegendPosition,
	type ChartStateProps,
	chartAccessibleName,
	chartColor,
} from "../internal/chart-types.js";
import "./donut-chart.css";

export interface DonutChartDatum {
	readonly color?: ChartColor;
	readonly label: string;
	readonly value: number;
}

export type DonutChartVariant = "donut" | "pie";

export interface DonutChartTooltipContext {
	readonly active: boolean;
	readonly item: DonutChartDatum;
}

export type DonutChartSelection = {
	readonly index: number;
	readonly item: DonutChartDatum;
} | null;

export type DonutChartProps = ChartAccessibleName &
	ChartStateProps & {
		readonly animation?: ChartAnimation;
		readonly centerLabel?: string;
		readonly data: readonly DonutChartDatum[];
		readonly label?: string;
		readonly legendOverflow?: ChartLegendOverflow;
		readonly legendPosition?: ChartLegendPosition;
		readonly onTooltipChange?: (
			context: DonutChartTooltipContext | null,
		) => void;
		readonly onValueChange?: (value: DonutChartSelection) => void;
		readonly renderTooltip?: (context: DonutChartTooltipContext) => ReactNode;
		readonly showLabel?: boolean;
		readonly showLegend?: boolean;
		readonly showTooltip?: boolean;
		readonly valueFormatter?: (value: number) => string;
		readonly variant?: DonutChartVariant;
	};

function DonutTooltip({
	active,
	onChange,
	payload,
	render,
	valueFormatter,
}: {
	readonly active?: boolean;
	readonly onChange?: (context: DonutChartTooltipContext | null) => void;
	readonly payload?: readonly {
		readonly payload?: DonutChartDatum;
	}[];
	readonly render?: (context: DonutChartTooltipContext) => ReactNode;
	readonly valueFormatter: (value: number) => string;
}): ReactElement | null {
	const item = payload?.[0]?.payload;
	const context = active && item ? { active: true, item } : null;
	const signature = context
		? `${context.item.label}:${context.item.value}`
		: "";
	const previousSignature = useRef<string | undefined>(undefined);

	useEffect(() => {
		if (!onChange || previousSignature.current === signature) return;
		previousSignature.current = signature;
		onChange(context);
	}, [context, onChange, signature]);

	if (!context) return null;
	if (render) return <>{render(context)}</>;
	return (
		<div className="ui-chart-tooltip" role="status">
			{context.item.label}: {valueFormatter(context.item.value)}
		</div>
	);
}

/** Donut or pie chart with selectable segments and explicit zero-total state. */
export function DonutChart({
	animation = "auto",
	centerLabel,
	className,
	data,
	emptyMessage = "No non-zero data available.",
	error,
	height = 320,
	label,
	legendOverflow = "wrap",
	legendPosition = "right",
	loading,
	onRetry,
	onTooltipChange,
	onValueChange,
	renderTooltip,
	showLabel = true,
	showLegend = true,
	showTooltip = true,
	style,
	valueFormatter = (value) => String(value),
	variant = "donut",
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledBy,
}: DonutChartProps): ReactElement {
	const [hiddenSeries, toggleSeries] = useChartSeriesVisibility();
	const [selected, setSelected] = useState<DonutChartSelection>(null);
	const animationActive = useChartAnimation(animation, data.length);
	const legendItems = data.map((item, index) => ({
		color: chartColor(item.color, index),
		id: item.label,
		name: item.label,
	}));
	const visibleData = data.filter((item) => !hiddenSeries.has(item.label));
	const total = visibleData.reduce(
		(sum, item) => sum + Math.max(0, item.value),
		0,
	);
	const frameName = chartAccessibleName(ariaLabel, ariaLabelledBy);
	const visibleLabel = centerLabel ?? label;

	function clearSelection(): void {
		if (!onValueChange || selected === null) return;
		setSelected(null);
		onValueChange(null);
	}

	return (
		<ChartVisualizationFrame
			{...frameName}
			animationActive={animationActive}
			className={["ui-donut-chart", className].filter(Boolean).join(" ")}
			dataLength={total > 0 ? data.length : 0}
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
			summary={`${data.length} ${variant} segments with a visible total of ${valueFormatter(total)}: ${data.map((item) => `${item.label} ${valueFormatter(item.value)}`).join(", ")}.`}
		>
			<div
				className="ui-donut-chart__canvas"
				onClick={selected ? clearSelection : undefined}
			>
				<ResponsiveContainer height="100%" width="100%">
					<PieChart accessibilityLayer>
						<Pie
							cx="50%"
							cy="50%"
							data={visibleData}
							dataKey="value"
							innerRadius={variant === "donut" ? "58%" : 0}
							isAnimationActive={animationActive}
							nameKey="label"
							onClick={
								onValueChange
									? (
											point: PieSectorDataItem,
											visibleIndex: number,
											event: MouseEvent<SVGGraphicsElement>,
										) => {
											event.stopPropagation();
											const item = point.payload as DonutChartDatum;
											const originalIndex = data.indexOf(item);
											const next =
												selected?.index === originalIndex
													? null
													: { index: originalIndex, item };
											setSelected(next);
											onValueChange(next);
											void visibleIndex;
										}
									: undefined
							}
							outerRadius="84%"
							paddingAngle={variant === "donut" ? 2 : 1}
							stroke="var(--surface)"
							strokeWidth={2}
						>
							{visibleData.map((item) => {
								const originalIndex = data.indexOf(item);
								return (
									<Cell
										className={
											onValueChange ? "ui-chart-selectable-mark" : undefined
										}
										fill={chartColor(item.color, originalIndex)}
										key={item.label}
										opacity={
											selected && selected.index !== originalIndex ? 0.3 : 1
										}
									/>
								);
							})}
						</Pie>
						<Tooltip
							content={(props) => (
								<DonutTooltip
									active={showTooltip ? props.active : false}
									onChange={onTooltipChange}
									payload={props.payload}
									render={renderTooltip}
									valueFormatter={valueFormatter}
								/>
							)}
							isAnimationActive={animationActive}
						/>
					</PieChart>
				</ResponsiveContainer>
				{variant === "donut" && showLabel && visibleLabel ? (
					<span aria-hidden="true" className="ui-donut-chart__center-label">
						{visibleLabel}
					</span>
				) : null}
			</div>
		</ChartVisualizationFrame>
	);
}

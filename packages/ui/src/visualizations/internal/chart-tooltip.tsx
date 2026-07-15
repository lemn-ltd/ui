import {
	type ReactElement,
	type ReactNode,
	useEffect,
	useMemo,
	useRef,
} from "react";
import {
	type ChartDatum,
	type ChartSeries,
	type ChartTooltipContext,
	chartColor,
	numericValue,
} from "./chart-types.js";

interface RendererTooltipEntry<TDatum extends ChartDatum> {
	readonly color?: string;
	readonly dataKey?: unknown;
	readonly name?: string | number;
	readonly payload?: TDatum;
	readonly value?: unknown;
}

export interface ChartTooltipContentProps<TDatum extends ChartDatum> {
	readonly active?: boolean;
	readonly label?: unknown;
	readonly onChange?: (context: ChartTooltipContext<TDatum> | null) => void;
	readonly payload?: readonly RendererTooltipEntry<TDatum>[];
	readonly render?: (context: ChartTooltipContext<TDatum>) => ReactNode;
	readonly series: readonly ChartSeries<TDatum>[];
}

/** Normalizes renderer tooltip payloads before they cross a consumer callback. */
export function ChartTooltipContent<TDatum extends ChartDatum>({
	active = false,
	label,
	onChange,
	payload = [],
	render,
	series,
}: ChartTooltipContentProps<TDatum>): ReactElement | null {
	const context = useMemo<ChartTooltipContext<TDatum>>(() => {
		const entries = payload.flatMap((item) => {
			const dataKey = String(item.dataKey ?? item.name ?? "") as Extract<
				keyof TDatum,
				string
			>;
			const definition = series.find(
				(candidate) => candidate.dataKey === dataKey,
			);
			const value = numericValue(item.value);
			if (!definition || value === undefined || !item.payload) return [];
			return [
				{
					color:
						definition.color ??
						chartColor(undefined, series.indexOf(definition)),
					dataKey,
					datum: item.payload,
					name: definition.name,
					value,
				},
			];
		});
		return {
			active: active && entries.length > 0,
			entries,
			label: label === undefined || label === null ? "" : String(label),
		};
	}, [active, label, payload, series]);

	const signature = `${context.active}:${context.label}:${context.entries
		.map((entry) => `${entry.dataKey}:${entry.value}`)
		.join("|")}`;
	const previousSignature = useRef<string | undefined>(undefined);

	useEffect(() => {
		if (!onChange || previousSignature.current === signature) return;
		previousSignature.current = signature;
		onChange(context.active ? context : null);
	}, [context, onChange, signature]);

	if (!context.active) return null;
	if (render) return <>{render(context)}</>;

	return (
		<div className="ui-chart-tooltip" role="status">
			{context.label ? (
				<p className="ui-chart-tooltip__label">{context.label}</p>
			) : null}
			<ul className="ui-chart-tooltip__entries">
				{context.entries.map((entry) => {
					const definition = series.find(
						(candidate) => candidate.dataKey === entry.dataKey,
					);
					return (
						<li key={entry.dataKey}>
							<span
								aria-hidden="true"
								className="ui-chart-tooltip__swatch"
								style={{ backgroundColor: entry.color }}
							/>
							<span>{entry.name}</span>
							<strong>
								{definition?.valueFormatter?.(entry.value) ??
									String(entry.value)}
							</strong>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

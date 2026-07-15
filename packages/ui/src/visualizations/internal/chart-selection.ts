import { useCallback, useState } from "react";
import type { ChartDatum, ChartSelection, ChartSeries } from "./chart-types.js";

export interface ChartSelectionController<TDatum extends ChartDatum> {
	readonly clear: () => void;
	readonly selected: ChartSelection<TDatum>;
	readonly select: (
		dataKey: Extract<keyof TDatum, string>,
		datum: TDatum,
		indexValue: string,
	) => void;
}

/** Owns toggle-and-clear semantics shared by all selectable charts. */
export function useChartSelection<TDatum extends ChartDatum>(
	series: readonly ChartSeries<TDatum>[],
	onValueChange: ((value: ChartSelection<TDatum>) => void) | undefined,
): ChartSelectionController<TDatum> {
	const [selected, setSelected] = useState<ChartSelection<TDatum>>(null);

	const clear = useCallback(() => {
		if (!onValueChange) return;
		setSelected(null);
		onValueChange(null);
	}, [onValueChange]);

	const select = useCallback(
		(
			dataKey: Extract<keyof TDatum, string>,
			datum: TDatum,
			indexValue: string,
		): void => {
			if (!onValueChange) return;
			const definition = series.find((item) => item.dataKey === dataKey);
			if (!definition) return;
			const next =
				selected?.dataKey === dataKey && selected.indexValue === indexValue
					? null
					: {
							dataKey,
							datum,
							indexValue,
							kind: "datum" as const,
							name: definition.name,
						};
			setSelected(next);
			onValueChange(next);
		},
		[onValueChange, selected, series],
	);

	return { clear, selected, select };
}

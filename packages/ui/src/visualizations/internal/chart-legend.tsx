import {
	type KeyboardEvent,
	type ReactElement,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import type {
	ChartColor,
	ChartLegendOverflow,
	ChartLegendPosition,
} from "./chart-types.js";

export interface ChartLegendItem {
	readonly color: ChartColor;
	readonly id: string;
	readonly name: string;
}

export function useChartSeriesVisibility(): readonly [
	ReadonlySet<string>,
	(seriesId: string) => void,
] {
	const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
	const toggle = useCallback((seriesId: string): void => {
		setHidden((current) => {
			const next = new Set(current);
			if (next.has(seriesId)) next.delete(seriesId);
			else next.add(seriesId);
			return next;
		});
	}, []);
	return [hidden, toggle];
}

export function ChartLegend({
	hidden,
	items,
	onToggle,
	overflow = "wrap",
	position = "right",
}: {
	readonly hidden: ReadonlySet<string>;
	readonly items: readonly ChartLegendItem[];
	readonly onToggle: (seriesId: string) => void;
	readonly overflow?: ChartLegendOverflow;
	readonly position?: ChartLegendPosition;
}): ReactElement {
	const viewportRef = useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);

	const updateScrollState = useCallback((): void => {
		const viewport = viewportRef.current;
		if (!viewport || overflow !== "scroll") {
			setCanScrollLeft(false);
			setCanScrollRight(false);
			return;
		}
		setCanScrollLeft(viewport.scrollLeft > 1);
		setCanScrollRight(
			viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1,
		);
	}, [overflow]);

	useEffect(() => {
		updateScrollState();
		const viewport = viewportRef.current;
		if (!viewport || typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver(updateScrollState);
		observer.observe(viewport);
		return () => observer.disconnect();
	}, [items, updateScrollState]);

	const scroll = useCallback((direction: -1 | 1): void => {
		const viewport = viewportRef.current;
		if (!viewport) return;
		viewport.scrollBy({
			behavior: "smooth",
			left: direction * Math.max(120, viewport.clientWidth * 0.8),
		});
	}, []);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>): void => {
			if (overflow !== "scroll") return;
			if (event.key === "ArrowLeft") {
				event.preventDefault();
				scroll(-1);
			} else if (event.key === "ArrowRight") {
				event.preventDefault();
				scroll(1);
			}
		},
		[overflow, scroll],
	);

	return (
		<div
			className="ui-chart-legend-frame"
			data-overflow={overflow}
			data-position={position}
		>
			<div
				aria-label={
					overflow === "scroll" ? "Scrollable chart series" : undefined
				}
				className="ui-chart-legend-frame__viewport"
				onKeyDown={handleKeyDown}
				onScroll={updateScrollState}
				ref={viewportRef}
				role={overflow === "scroll" ? "region" : undefined}
				tabIndex={overflow === "scroll" ? 0 : undefined}
			>
				<ul aria-label="Chart series" className="ui-chart-legend">
					{items.map((item, index) => {
						const visible = !hidden.has(item.id);
						return (
							<li key={item.id}>
								<button
									aria-pressed={visible}
									className="ui-chart-legend__button"
									onClick={() => onToggle(item.id)}
									type="button"
								>
									<span
										aria-hidden="true"
										className="ui-chart-legend__swatch"
										data-pattern={(index % 4) + 1}
										style={{
											backgroundColor:
												index % 4 === 2 ? "transparent" : item.color,
											borderColor: item.color,
										}}
									/>
									<span>{item.name}</span>
								</button>
							</li>
						);
					})}
				</ul>
			</div>
			{overflow === "scroll" ? (
				<div className="ui-chart-legend-frame__controls">
					<button
						aria-label="Scroll legend left"
						disabled={!canScrollLeft}
						onClick={() => scroll(-1)}
						type="button"
					>
						<span aria-hidden="true">‹</span>
					</button>
					<button
						aria-label="Scroll legend right"
						disabled={!canScrollRight}
						onClick={() => scroll(1)}
						type="button"
					>
						<span aria-hidden="true">›</span>
					</button>
				</div>
			) : null}
		</div>
	);
}

import type { ReactElement } from "react";
import { ChartFrame } from "../chart-frame/chart-frame.js";
import {
	type ChartAccessibleName,
	type ChartColor,
	type ChartStateProps,
	chartAccessibleName,
	chartColor,
} from "../internal/chart-types.js";
import "./bar-list.css";

interface BarListItemBase {
	readonly color?: ChartColor;
	readonly label: string;
	readonly value: number;
	readonly valueLabel?: string;
}

export type BarListItem = BarListItemBase &
	(
		| { readonly href: string; readonly onSelect?: never }
		| { readonly href?: never; readonly onSelect: () => void }
		| { readonly href?: never; readonly onSelect?: never }
	);

export type BarListProps = ChartAccessibleName &
	ChartStateProps & {
		readonly items: readonly BarListItem[];
		readonly valueFormatter?: (value: number) => string;
	};

/** Ordered categories whose native CSS bars are scaled to the largest value. */
export function BarList({
	className,
	emptyMessage,
	error,
	height,
	items,
	loading,
	onRetry,
	style,
	valueFormatter = (value) => String(value),
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledBy,
}: BarListProps): ReactElement {
	const max = items.reduce((peak, item) => Math.max(peak, item.value), 0);
	const frameName = chartAccessibleName(ariaLabel, ariaLabelledBy);

	return (
		<ChartFrame
			{...frameName}
			className={["ui-bar-list", className].filter(Boolean).join(" ")}
			empty={items.length === 0}
			emptyMessage={emptyMessage}
			error={error}
			height={height}
			loading={loading}
			onRetry={onRetry}
			style={style}
		>
			<ol className="ui-bar-list__items">
				{items.map((item, index) => {
					const ratio = max > 0 ? Math.max(0, item.value) / max : 0;
					const content = (
						<>
							<span
								aria-hidden="true"
								className="ui-bar-list__bar"
								style={{
									backgroundColor: chartColor(item.color, index),
									transform: `scaleX(${ratio})`,
								}}
							/>
							<span className="ui-bar-list__label">{item.label}</span>
							<span className="ui-bar-list__value">
								{item.valueLabel ?? valueFormatter(item.value)}
							</span>
						</>
					);
					return (
						<li className="ui-bar-list__item" key={item.label}>
							{item.href ? (
								<a className="ui-bar-list__content" href={item.href}>
									{content}
								</a>
							) : item.onSelect ? (
								<button
									className="ui-bar-list__content"
									onClick={item.onSelect}
									type="button"
								>
									{content}
								</button>
							) : (
								<div className="ui-bar-list__content">{content}</div>
							)}
						</li>
					);
				})}
			</ol>
		</ChartFrame>
	);
}

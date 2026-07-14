import type { ReactElement } from "react";
import { ChartFrame } from "../chart-frame/chart-frame.js";
import {
	type ChartAccessibleName,
	type ChartColor,
	type ChartStateProps,
	chartAccessibleName,
	chartColor,
} from "../internal/chart-types.js";
import "./category-bar.css";

export interface CategoryBarItem {
	readonly color?: ChartColor;
	readonly label: string;
	readonly value: number;
}

export type CategoryBarProps = ChartAccessibleName &
	ChartStateProps & {
		readonly items: readonly CategoryBarItem[];
		readonly showLegend?: boolean;
		readonly valueFormatter?: (value: number) => string;
	};

/** Native segmented distribution bar with labels that preserve meaning beyond color. */
export function CategoryBar({
	className,
	emptyMessage = "No non-zero data available.",
	error,
	height,
	items,
	loading,
	onRetry,
	showLegend = true,
	style,
	valueFormatter = (value) => String(value),
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledBy,
}: CategoryBarProps): ReactElement {
	const total = items.reduce((sum, item) => sum + Math.max(0, item.value), 0);
	const frameName = chartAccessibleName(ariaLabel, ariaLabelledBy);

	return (
		<ChartFrame
			{...frameName}
			className={["ui-category-bar", className].filter(Boolean).join(" ")}
			empty={items.length === 0 || total === 0}
			emptyMessage={emptyMessage}
			error={error}
			height={height}
			loading={loading}
			onRetry={onRetry}
			style={style}
		>
			<div aria-hidden="true" className="ui-category-bar__track">
				{items.map((item, index) => (
					<span
						className="ui-category-bar__segment"
						key={item.label}
						style={{
							backgroundColor: chartColor(item.color, index),
							width: `${(Math.max(0, item.value) / total) * 100}%`,
						}}
					/>
				))}
			</div>
			{showLegend ? (
				<ul className="ui-category-bar__legend">
					{items.map((item, index) => (
						<li key={item.label}>
							<span
								aria-hidden="true"
								className="ui-category-bar__swatch"
								data-pattern={(index % 4) + 1}
								style={{ borderColor: chartColor(item.color, index) }}
							/>
							<span>{item.label}</span>
							<span className="ui-category-bar__value">
								{valueFormatter(item.value)}
							</span>
						</li>
					))}
				</ul>
			) : (
				<p className="ui-category-bar__sr-only">
					{items
						.map((item) => `${item.label} ${valueFormatter(item.value)}`)
						.join(", ")}
					.
				</p>
			)}
		</ChartFrame>
	);
}

import type { CSSProperties, HTMLAttributes, ReactElement } from "react";
import type {
	ChartAccessibleName,
	ChartColor,
} from "../internal/chart-types.js";
import "./tracker.css";

export type TrackerStatus = "complete" | "active" | "pending" | "error";

export interface TrackerItem {
	readonly color?: ChartColor;
	readonly description?: string;
	readonly label: string;
	readonly status?: TrackerStatus;
	readonly tooltip?: string;
}

export type TrackerProps = ChartAccessibleName &
	Omit<
		HTMLAttributes<HTMLOListElement>,
		"aria-label" | "aria-labelledby" | "children"
	> & {
		readonly defaultColor?: ChartColor;
		readonly hoverEffect?: boolean;
		readonly items: readonly TrackerItem[];
	};

/** Discrete status sequence whose labels preserve meaning without its colors. */
export function Tracker({
	className,
	defaultColor,
	hoverEffect = false,
	items,
	"aria-label": ariaLabel,
	"aria-labelledby": ariaLabelledBy,
	...rest
}: TrackerProps): ReactElement {
	return (
		<ol
			aria-label={ariaLabel}
			aria-labelledby={ariaLabelledBy}
			className={["ui-tracker", className].filter(Boolean).join(" ")}
			data-hover-effect={hoverEffect}
			{...rest}
		>
			{items.map((item) => (
				<li
					className="ui-tracker__item"
					data-custom-color={Boolean(item.color ?? defaultColor) || undefined}
					data-status={item.status ?? "pending"}
					key={item.label}
					style={
						{
							"--ui-tracker-color": item.color ?? defaultColor,
						} as CSSProperties
					}
					title={item.tooltip ?? item.description}
				>
					<span aria-hidden="true" className="ui-tracker__block" />
					<span className="ui-tracker__sr-only">
						{item.label}: {item.status ?? "pending"}. {item.description}
					</span>
				</li>
			))}
		</ol>
	);
}

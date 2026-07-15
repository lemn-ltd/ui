import type { CSSProperties, HTMLAttributes, ReactElement } from "react";
import type {
	ChartAccessibleName,
	ChartColor,
} from "../internal/chart-types.js";
import {
	TremorTracker,
	type TremorTrackerBlockProps,
} from "./tremor-tracker.internal.js";
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
	const data: TremorTrackerBlockProps[] = items.map((item) => {
		const status = item.status ?? "pending";
		const customColor = item.color ?? defaultColor;
		return {
			accessibleLabel: [
				`${item.label}: ${status}.`,
				item.description,
			]
				.filter(Boolean)
				.join(" "),
			color: customColor
				? "ui-tracker-provider__block--custom"
				: `ui-tracker-provider__block--${status}`,
			...(customColor
				? {
						blockStyle: {
							"--ui-tracker-color": customColor,
						} as CSSProperties,
						customColor: true,
					}
				: {}),
			status,
			tooltip: item.tooltip ?? item.description,
		};
	});

	return (
		<TremorTracker
			aria-label={ariaLabel}
			aria-labelledby={ariaLabelledBy}
			className={["ui-tracker", className].filter(Boolean).join(" ")}
			data={data}
			hoverEffect={hoverEffect}
			{...rest}
		/>
	);
}

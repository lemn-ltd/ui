import type {
	CSSProperties,
	HTMLAttributes,
	ReactElement,
	ReactNode,
} from "react";
import "./progress-bar.css";

export type ProgressBarVariant = "determinate" | "indeterminate" | "route";
export type ProgressBarTone =
	| "default"
	| "neutral"
	| "warning"
	| "error"
	| "success";
export type ProgressBarAnimation = "auto" | "none";

export interface ProgressBarProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
	readonly variant?: ProgressBarVariant;
	readonly animation?: ProgressBarAnimation;
	readonly label?: ReactNode;
	readonly max?: number;
	readonly tone?: ProgressBarTone;
	readonly value?: number;
	readonly showLabel?: boolean;
}

function clampValue(value: number, max: number): number {
	return Math.min(max, Math.max(0, value));
}

/** Linear progress; determinate carries ARIA, loops are static under reduced motion. */
export function ProgressBar({
	animation = "auto",
	label,
	max = 100,
	tone = "default",
	variant = "determinate",
	value = 0,
	showLabel = false,
	className,
	style,
	...rest
}: ProgressBarProps): ReactElement {
	const isDeterminate = variant === "determinate";
	const safeMax = max > 0 ? max : 100;
	const clampedValue = clampValue(value, safeMax);
	const percent = (clampedValue / safeMax) * 100;

	const fillStyle = isDeterminate
		? ({ "--ui-progress-value": `${percent}%` } as CSSProperties)
		: undefined;

	return (
		<div
			className={["ui-progress-bar", className].filter(Boolean).join(" ")}
			data-animation={animation}
			data-tone={tone}
			data-variant={variant}
			style={style}
			{...(isDeterminate
				? {
						role: "progressbar",
						"aria-valuenow": clampedValue,
						"aria-valuemin": 0,
						"aria-valuemax": safeMax,
					}
				: {})}
			{...rest}
		>
			<div className="ui-progress-bar__fill" style={fillStyle} />
			{isDeterminate && (label !== undefined || showLabel) ? (
				<span className="ui-progress-bar__label">
					{label ?? `${Math.round(percent)}%`}
				</span>
			) : null}
		</div>
	);
}

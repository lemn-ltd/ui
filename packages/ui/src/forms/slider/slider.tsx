import { Slider as RadixSlider } from "radix-ui";
import { type ReactElement, type ReactNode, useState } from "react";
import "./slider.css";

export interface SliderProps {
	readonly value?: readonly number[];
	readonly defaultValue?: readonly number[];
	readonly onValueChange?: (value: number[]) => void;
	readonly onValueCommit?: (value: number[]) => void;
	readonly min?: number;
	readonly max?: number;
	readonly step?: number;
	readonly minStepsBetweenThumbs?: number;
	readonly disabled?: boolean;
	readonly orientation?: "horizontal" | "vertical";
	readonly dir?: "ltr" | "rtl";
	readonly inverted?: boolean;
	readonly "aria-labels": readonly [string] | readonly [string, string];
	readonly valueFormatter?: (value: number, index: number) => ReactNode;
	readonly showValue?: boolean;
	readonly className?: string;
}

function validateThumbs(
	values: readonly number[],
	labels: readonly string[],
): void {
	if (values.length < 1 || values.length > 2) {
		throw new Error("Slider supports exactly one or two thumbs.");
	}
	if (labels.length !== values.length) {
		throw new Error("Slider requires one accessible label per thumb.");
	}
}

/** One- or two-thumb numeric input built on Radix Slider semantics. */
export function Slider({
	value,
	defaultValue,
	onValueChange,
	onValueCommit,
	min = 0,
	max = 100,
	step = 1,
	minStepsBetweenThumbs,
	disabled,
	orientation = "horizontal",
	dir,
	inverted,
	"aria-labels": ariaLabels,
	valueFormatter = (next) => next,
	showValue = true,
	className,
}: SliderProps): ReactElement {
	const [localValue, setLocalValue] = useState<number[]>(() => [
		...(defaultValue ?? value ?? [min]),
	]);
	const renderedValues = value ?? localValue;
	validateThumbs(renderedValues, ariaLabels);

	function handleValueChange(nextValue: number[]): void {
		if (value === undefined) setLocalValue(nextValue);
		onValueChange?.(nextValue);
	}

	return (
		<div
			className={["ui-slider", className].filter(Boolean).join(" ")}
			data-disabled={disabled || undefined}
			data-orientation={orientation}
		>
			{showValue ? (
				<div aria-hidden="true" className="ui-slider__values">
					{renderedValues.map((next, index) => (
						<span key={ariaLabels[index]}>{valueFormatter(next, index)}</span>
					))}
				</div>
			) : null}
			<RadixSlider.Root
				className="ui-slider__root"
				dir={dir}
				disabled={disabled}
				inverted={inverted}
				max={max}
				min={min}
				minStepsBetweenThumbs={minStepsBetweenThumbs}
				onValueChange={handleValueChange}
				onValueCommit={onValueCommit}
				orientation={orientation}
				step={step}
				value={[...renderedValues]}
			>
				<RadixSlider.Track className="ui-slider__track">
					<RadixSlider.Range className="ui-slider__range" />
				</RadixSlider.Track>
				{renderedValues.map((next, index) => {
					const formatted = valueFormatter(next, index);
					return (
						<RadixSlider.Thumb
							aria-label={ariaLabels[index]}
							aria-valuetext={
								typeof formatted === "string" || typeof formatted === "number"
									? String(formatted)
									: undefined
							}
							className="ui-slider__thumb"
							key={ariaLabels[index]}
						/>
					);
				})}
			</RadixSlider.Root>
		</div>
	);
}

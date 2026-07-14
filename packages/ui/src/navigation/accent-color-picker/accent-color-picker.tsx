import { Popover as RadixPopover } from "radix-ui";
import {
	type CSSProperties,
	type ReactElement,
	type PointerEvent as ReactPointerEvent,
	useEffect,
	useState,
} from "react";
import { Button, Icon, IconButton } from "../../primitives/index.js";
import {
	applyAccentColor,
	DEFAULT_ACCENT_COLOR,
	getAccentColor,
	type HsvColor,
	hexToHsv,
	hsvToHex,
	normalizeAccentColor,
	resetAccentColor,
	setAccentColor,
} from "./accent-color.js";
import "./accent-color-picker.css";

export interface AccentColorPickerProps {
	readonly value?: string;
	readonly defaultValue?: string;
	readonly onValueChange?: (value: string) => void;
	readonly applyToRoot?: boolean;
	readonly persist?: boolean;
	readonly disabled?: boolean;
	readonly label?: string;
	readonly className?: string;
}

function clamp(value: number): number {
	return Math.min(100, Math.max(0, value));
}

/** Theme companion control with pointer and keyboard color selection. */
export function AccentColorPicker({
	value,
	defaultValue,
	onValueChange,
	applyToRoot = true,
	persist = true,
	disabled,
	label = "Change accent color",
	className,
}: AccentColorPickerProps): ReactElement {
	const [localValue, setLocalValue] = useState(
		() => normalizeAccentColor(defaultValue ?? "") ?? getAccentColor(),
	);
	const currentValue = normalizeAccentColor(value ?? "") ?? localValue;
	const hsv = hexToHsv(currentValue);

	useEffect(() => {
		if (!applyToRoot) return;
		if (persist) setAccentColor(currentValue);
		else applyAccentColor(currentValue);
	}, [applyToRoot, currentValue, persist]);

	function update(next: HsvColor): void {
		const normalized = hsvToHex(next);
		if (value === undefined) setLocalValue(normalized);
		onValueChange?.(normalized);
	}

	function updateFromPointer(
		event: ReactPointerEvent<HTMLButtonElement>,
	): void {
		const bounds = event.currentTarget.getBoundingClientRect();
		if (bounds.width === 0 || bounds.height === 0) return;
		update({
			hue: hsv.hue,
			saturation: clamp(((event.clientX - bounds.left) / bounds.width) * 100),
			value: clamp((1 - (event.clientY - bounds.top) / bounds.height) * 100),
		});
	}

	function reset(): void {
		if (value === undefined) setLocalValue(DEFAULT_ACCENT_COLOR);
		if (applyToRoot) resetAccentColor();
		onValueChange?.(DEFAULT_ACCENT_COLOR);
	}

	return (
		<RadixPopover.Root>
			<RadixPopover.Trigger asChild>
				<IconButton
					aria-label={label}
					className={["ui-accent-color-picker__trigger", className]
						.filter(Boolean)
						.join(" ")}
					disabled={disabled}
					variant="ghost"
				>
					<span
						aria-hidden="true"
						className="ui-accent-color-picker__trigger-swatch"
						style={{ backgroundColor: "var(--accent)" }}
					/>
				</IconButton>
			</RadixPopover.Trigger>
			<RadixPopover.Portal>
				<RadixPopover.Content
					align="end"
					aria-label="Accent color controls"
					className="ui-accent-color-picker"
					side="bottom"
					sideOffset={6}
				>
					<div className="ui-accent-color-picker__header">
						<strong>Accent color</strong>
						<output aria-live="polite">{currentValue.toUpperCase()}</output>
					</div>
					<button
						aria-label={`Accent saturation ${Math.round(hsv.saturation)} percent and brightness ${Math.round(hsv.value)} percent. Use arrow keys to adjust.`}
						className="ui-accent-color-picker__field"
						onKeyDown={(event) => {
							const delta = event.shiftKey ? 10 : 1;
							if (
								!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
									event.key,
								)
							)
								return;
							event.preventDefault();
							update({
								hue: hsv.hue,
								saturation: clamp(
									hsv.saturation +
										(event.key === "ArrowLeft"
											? -delta
											: event.key === "ArrowRight"
												? delta
												: 0),
								),
								value: clamp(
									hsv.value +
										(event.key === "ArrowDown"
											? -delta
											: event.key === "ArrowUp"
												? delta
												: 0),
								),
							});
						}}
						onPointerDown={(event) => {
							event.currentTarget.setPointerCapture(event.pointerId);
							updateFromPointer(event);
						}}
						onPointerMove={(event) => {
							if (event.currentTarget.hasPointerCapture(event.pointerId))
								updateFromPointer(event);
						}}
						style={
							{ "--ui-accent-picker-hue": String(hsv.hue) } as CSSProperties
						}
						type="button"
					>
						<span
							aria-hidden="true"
							className="ui-accent-color-picker__pointer"
							style={{ left: `${hsv.saturation}%`, top: `${100 - hsv.value}%` }}
						/>
					</button>
					<label className="ui-accent-color-picker__hue">
						<span>Hue</span>
						<input
							aria-label="Accent hue"
							max="359"
							min="0"
							onChange={(event) =>
								update({ ...hsv, hue: event.currentTarget.valueAsNumber })
							}
							type="range"
							value={hsv.hue}
						/>
					</label>
					<div className="ui-accent-color-picker__footer">
						<span
							className="ui-accent-color-picker__preview"
							style={{ backgroundColor: "var(--accent)" }}
						/>
						<Button onClick={reset} size="sm" variant="outline">
							<Icon name="rotate-ccw" size={14} />
							Reset
						</Button>
					</div>
				</RadixPopover.Content>
			</RadixPopover.Portal>
		</RadixPopover.Root>
	);
}

export {
	applyAccentColor,
	DEFAULT_ACCENT_COLOR,
	getAccentColor,
	resetAccentColor,
	setAccentColor,
};

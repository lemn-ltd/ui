import { Popover as RadixPopover } from "radix-ui";
import {
	type CSSProperties,
	type ReactElement,
	type PointerEvent as ReactPointerEvent,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { Button, Icon, IconButton, Input } from "../../primitives/index.js";
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
	const [hexDraft, setHexDraft] = useState(() => currentValue.toUpperCase());
	const [hexInvalid, setHexInvalid] = useState(false);
	const [hexEditing, setHexEditing] = useState(false);
	const hexErrorId = useId();
	const dragCleanupRef = useRef<(() => void) | undefined>(undefined);

	useEffect(() => {
		if (!applyToRoot) return;
		if (persist) setAccentColor(currentValue);
		else applyAccentColor(currentValue);
	}, [applyToRoot, currentValue, persist]);

	useEffect(() => {
		if (hexEditing) return;
		setHexDraft(currentValue.toUpperCase());
		setHexInvalid(false);
	}, [currentValue, hexEditing]);

	useEffect(() => () => dragCleanupRef.current?.(), []);

	function commitColor(normalized: string): void {
		if (value === undefined) setLocalValue(normalized);
		onValueChange?.(normalized);
	}

	function update(next: HsvColor): void {
		commitColor(hsvToHex(next));
	}

	function updateFromCoordinates(
		field: HTMLButtonElement,
		clientX: number,
		clientY: number,
	): void {
		const bounds = field.getBoundingClientRect();
		if (bounds.width === 0 || bounds.height === 0) return;
		update({
			hue: hsv.hue,
			saturation: clamp(((clientX - bounds.left) / bounds.width) * 100),
			value: clamp((1 - (clientY - bounds.top) / bounds.height) * 100),
		});
	}

	function startPointerDrag(
		event: ReactPointerEvent<HTMLButtonElement>,
	): void {
		dragCleanupRef.current?.();
		const field = event.currentTarget;
		const activePointerId = event.pointerId;

		const cleanup = (): void => {
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", handlePointerEnd);
			window.removeEventListener("pointercancel", handlePointerEnd);
			if (dragCleanupRef.current === cleanup)
				dragCleanupRef.current = undefined;
		};
		const handlePointerMove = (pointerEvent: PointerEvent): void => {
			if (pointerEvent.pointerId !== activePointerId) return;
			pointerEvent.preventDefault();
			updateFromCoordinates(field, pointerEvent.clientX, pointerEvent.clientY);
		};
		const handlePointerEnd = (pointerEvent: PointerEvent): void => {
			if (pointerEvent.pointerId === activePointerId) cleanup();
		};

		window.addEventListener("pointermove", handlePointerMove, { passive: false });
		window.addEventListener("pointerup", handlePointerEnd);
		window.addEventListener("pointercancel", handlePointerEnd);
		dragCleanupRef.current = cleanup;

		try {
			field.setPointerCapture(activePointerId);
		} catch {
			// Window listeners keep dragging live when pointer capture is unavailable.
		}
		updateFromCoordinates(field, event.clientX, event.clientY);
	}

	function commitHex(): void {
		const normalized = normalizeAccentColor(hexDraft);
		if (!normalized) {
			setHexInvalid(true);
			return;
		}
		setHexInvalid(false);
		setHexDraft(normalized.toUpperCase());
		commitColor(normalized);
	}

	function reset(): void {
		if (value === undefined) {
			setLocalValue(DEFAULT_ACCENT_COLOR);
			if (applyToRoot) resetAccentColor();
		}
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
						onPointerDown={startPointerDrag}
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
							style={
								{ "--ui-accent-picker-hue": String(hsv.hue) } as CSSProperties
							}
							type="range"
							value={hsv.hue}
						/>
					</label>
					<label className="ui-accent-color-picker__hex">
						<span>Hex</span>
						<Input
							aria-describedby={hexInvalid ? hexErrorId : undefined}
							aria-label="Accent hex color"
							autoCapitalize="off"
							invalid={hexInvalid}
							maxLength={7}
							onBlur={() => {
								setHexEditing(false);
								setHexDraft(currentValue.toUpperCase());
								setHexInvalid(false);
							}}
							onChange={(event) => {
								setHexDraft(event.currentTarget.value);
								setHexInvalid(false);
							}}
							onFocus={() => setHexEditing(true)}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									commitHex();
								}
								if (event.key === "Escape") {
									setHexDraft(currentValue.toUpperCase());
									setHexInvalid(false);
									event.currentTarget.blur();
								}
							}}
							spellCheck={false}
							value={hexDraft}
						/>
					</label>
					{hexInvalid ? (
						<span
							className="ui-accent-color-picker__hex-error"
							id={hexErrorId}
							role="alert"
						>
							Enter a 6-digit hex color.
						</span>
					) : null}
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

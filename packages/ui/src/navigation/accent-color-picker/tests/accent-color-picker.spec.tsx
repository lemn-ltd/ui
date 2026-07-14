import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	AccentColorPicker,
	applyAccentColor,
	DEFAULT_ACCENT_COLOR,
	resetAccentColor,
} from "../accent-color-picker.js";

describe("AccentColorPicker", () => {
	beforeEach(() => resetAccentColor());
	afterEach(() => {
		cleanup();
		resetAccentColor();
	});

	it("derives live theme tokens from a normalized color", () => {
		expect(applyAccentColor("#7C3AED")).toBe("#7c3aed");
		expect(document.documentElement.dataset.accentColor).toBe("#7c3aed");
		expect(
			document.documentElement.style.getPropertyValue("--accent"),
		).toContain("light-dark(");

		resetAccentColor();
		expect(document.documentElement.dataset.accentColor).toBeUndefined();
		expect(document.documentElement.style.getPropertyValue("--accent")).toBe(
			"",
		);
	});

	it("updates uncontrolled color from keyboard and reports it in real time", async () => {
		const onValueChange = vi.fn();
		render(<AccentColorPicker onValueChange={onValueChange} persist={false} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Change accent color" }),
		);
		const field = await screen.findByRole("button", {
			name: /Accent saturation/,
		});
		fireEvent.keyDown(field, { key: "ArrowLeft" });

		expect(onValueChange).toHaveBeenCalledOnce();
		expect(onValueChange.mock.calls[0]?.[0]).toMatch(/^#[\da-f]{6}$/);
		expect(screen.getByRole("status").textContent).not.toBe(
			DEFAULT_ACCENT_COLOR.toUpperCase(),
		);
	});

	it("selects a different hue and applies it in real time", async () => {
		const onValueChange = vi.fn();
		render(<AccentColorPicker onValueChange={onValueChange} persist={false} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Change accent color" }),
		);
		const hue = await screen.findByRole("slider", { name: "Accent hue" });
		fireEvent.change(hue, { target: { value: "240" } });

		expect(onValueChange).toHaveBeenLastCalledWith("#0d0d94");
		expect(screen.getByRole("status").textContent).toBe("#0D0D94");
		expect(document.documentElement.dataset.accentColor).toBe("#0d0d94");
	});

	it("keeps palette dragging live through window pointer events", async () => {
		const onValueChange = vi.fn();
		render(<AccentColorPicker onValueChange={onValueChange} persist={false} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Change accent color" }),
		);
		const field = await screen.findByRole("button", {
			name: /Accent saturation/,
		});
		vi.spyOn(field, "getBoundingClientRect").mockReturnValue({
			bottom: 100,
			height: 100,
			left: 0,
			right: 100,
			top: 0,
			width: 100,
			x: 0,
			y: 0,
			toJSON: () => ({}),
		});

		fireEvent.pointerDown(field, { clientX: 20, clientY: 20, pointerId: 7 });
		fireEvent.pointerMove(window, {
			clientX: 80,
			clientY: 80,
			pointerId: 7,
		});
		fireEvent.pointerUp(window, { pointerId: 7 });

		expect(onValueChange).toHaveBeenCalledTimes(2);
		expect(onValueChange.mock.calls[0]?.[0]).not.toBe(
			onValueChange.mock.calls[1]?.[0],
		);
		expect(document.documentElement.dataset.accentColor).toBe(
			onValueChange.mock.calls[1]?.[0],
		);
	});

	it("applies a valid hexadecimal color on Enter", async () => {
		const onValueChange = vi.fn();
		render(<AccentColorPicker onValueChange={onValueChange} persist={false} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Change accent color" }),
		);
		const input = await screen.findByRole("textbox", {
			name: "Accent hex color",
		});
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "#7C3AED" } });
		fireEvent.keyDown(input, { key: "Enter" });

		expect(onValueChange).toHaveBeenLastCalledWith("#7c3aed");
		expect(document.documentElement.dataset.accentColor).toBe("#7c3aed");
		expect((input as HTMLInputElement).value).toBe("#7C3AED");
	});

	it("shows the exact selected color in both swatches", async () => {
		render(<AccentColorPicker persist={false} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Change accent color" }),
		);
		const input = await screen.findByRole("textbox", {
			name: "Accent hex color",
		});
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "#000000" } });
		fireEvent.keyDown(input, { key: "Enter" });

		const triggerSwatch = document.querySelector<HTMLElement>(
			".ui-accent-color-picker__trigger-swatch",
		);
		const previewSwatch = document.querySelector<HTMLElement>(
			".ui-accent-color-picker__preview",
		);
		expect(triggerSwatch?.style.backgroundColor).toBe("#000000");
		expect(previewSwatch?.style.backgroundColor).toBe("#000000");
		expect(document.documentElement.dataset.accentColor).toBe("#000000");
	});

	it("rejects an invalid hexadecimal color without changing the accent", async () => {
		const onValueChange = vi.fn();
		render(<AccentColorPicker onValueChange={onValueChange} persist={false} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Change accent color" }),
		);
		const input = await screen.findByRole("textbox", {
			name: "Accent hex color",
		});
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "#12ZZ99" } });
		fireEvent.keyDown(input, { key: "Enter" });

		expect(onValueChange).not.toHaveBeenCalled();
		expect(input.getAttribute("aria-invalid")).toBe("true");
		expect(screen.getByRole("alert").textContent).toContain(
			"Enter a 6-digit hex color.",
		);
		expect(document.documentElement.dataset.accentColor).toBeUndefined();
	});

	it("resets to the canonical accent", async () => {
		const onValueChange = vi.fn();
		render(
			<AccentColorPicker
				defaultValue="#7c3aed"
				onValueChange={onValueChange}
				persist={false}
			/>,
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Change accent color" }),
		);
		fireEvent.click(await screen.findByRole("button", { name: /Reset/ }));
		expect(onValueChange).toHaveBeenLastCalledWith(DEFAULT_ACCENT_COLOR);
	});

	it("leaves controlled tokens unchanged until the owner accepts reset", async () => {
		const onValueChange = vi.fn();
		const { rerender } = render(
			<AccentColorPicker
				onValueChange={onValueChange}
				persist={false}
				value="#7c3aed"
			/>,
		);
		expect(document.documentElement.dataset.accentColor).toBe("#7c3aed");

		fireEvent.click(
			screen.getByRole("button", { name: "Change accent color" }),
		);
		fireEvent.click(await screen.findByRole("button", { name: /Reset/ }));

		expect(onValueChange).toHaveBeenLastCalledWith(DEFAULT_ACCENT_COLOR);
		expect(document.documentElement.dataset.accentColor).toBe("#7c3aed");
		expect(screen.getByRole("status").textContent).toBe("#7C3AED");

		rerender(
			<AccentColorPicker
				onValueChange={onValueChange}
				persist={false}
				value={DEFAULT_ACCENT_COLOR}
			/>,
		);
		expect(document.documentElement.dataset.accentColor).toBeUndefined();
	});
});

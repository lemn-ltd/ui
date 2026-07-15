import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccentColorPicker, DEFAULT_ACCENT_COLOR } from "../accent-color-picker.js";

afterEach(cleanup);

describe("AccentColorPicker", () => {
	it("is controlled authoring UI and never mutates document branding", async () => {
		const onValueChange = vi.fn();
		render(<AccentColorPicker onValueChange={onValueChange} value="#7c3aed" />);
		fireEvent.click(screen.getByRole("button", { name: "Change accent color" }));
		const input = await screen.findByRole("textbox", { name: "Accent hex color" });
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "#000000" } });
		fireEvent.keyDown(input, { key: "Enter" });

		expect(onValueChange).toHaveBeenLastCalledWith("#000000");
		expect(screen.getByRole("status").textContent).toBe("#7C3AED");
		expect(document.documentElement.dataset.accentColor).toBeUndefined();
		expect(document.documentElement.getAttribute("style")).toBeNull();
	});

	it("updates uncontrolled color from keyboard and reports it in real time", async () => {
		const onValueChange = vi.fn();
		render(<AccentColorPicker onValueChange={onValueChange} />);
		fireEvent.click(screen.getByRole("button", { name: "Change accent color" }));
		const field = await screen.findByRole("button", { name: /Accent saturation/ });
		fireEvent.keyDown(field, { key: "ArrowLeft" });
		expect(onValueChange).toHaveBeenCalledOnce();
		expect(onValueChange.mock.calls[0]?.[0]).toMatch(/^#[\da-f]{6}$/);
		expect(screen.getByRole("status").textContent).not.toBe(DEFAULT_ACCENT_COLOR.toUpperCase());
	});

	it("updates hue in real time", async () => {
		const onValueChange = vi.fn();
		render(<AccentColorPicker onValueChange={onValueChange} />);
		fireEvent.click(screen.getByRole("button", { name: "Change accent color" }));
		fireEvent.change(await screen.findByRole("slider", { name: "Accent hue" }), { target: { value: "240" } });
		expect(onValueChange).toHaveBeenLastCalledWith("#0d0d94");
		expect(screen.getByRole("status").textContent).toBe("#0D0D94");
	});

	it("keeps palette dragging live through window pointer events", async () => {
		const onValueChange = vi.fn();
		render(<AccentColorPicker onValueChange={onValueChange} />);
		fireEvent.click(screen.getByRole("button", { name: "Change accent color" }));
		const field = await screen.findByRole("button", { name: /Accent saturation/ });
		vi.spyOn(field, "getBoundingClientRect").mockReturnValue({ bottom: 100, height: 100, left: 0, right: 100, top: 0, width: 100, x: 0, y: 0, toJSON: () => ({}) });
		fireEvent.pointerDown(field, { clientX: 20, clientY: 20, pointerId: 7 });
		fireEvent.pointerMove(window, { clientX: 80, clientY: 80, pointerId: 7 });
		fireEvent.pointerUp(window, { pointerId: 7 });
		expect(onValueChange).toHaveBeenCalledTimes(2);
		expect(onValueChange.mock.calls[0]?.[0]).not.toBe(onValueChange.mock.calls[1]?.[0]);
	});

	it("applies a valid hexadecimal color on Enter and updates both swatches", async () => {
		render(<AccentColorPicker />);
		fireEvent.click(screen.getByRole("button", { name: "Change accent color" }));
		const input = await screen.findByRole("textbox", { name: "Accent hex color" });
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "#000000" } });
		fireEvent.keyDown(input, { key: "Enter" });
		expect(document.querySelector<HTMLElement>(".ui-accent-color-picker__trigger-swatch")?.style.backgroundColor).toBe("#000000");
		expect(document.querySelector<HTMLElement>(".ui-accent-color-picker__preview")?.style.backgroundColor).toBe("#000000");
	});

	it("rejects invalid hexadecimal input", async () => {
		const onValueChange = vi.fn();
		render(<AccentColorPicker onValueChange={onValueChange} />);
		fireEvent.click(screen.getByRole("button", { name: "Change accent color" }));
		const input = await screen.findByRole("textbox", { name: "Accent hex color" });
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: "#12ZZ99" } });
		fireEvent.keyDown(input, { key: "Enter" });
		expect(onValueChange).not.toHaveBeenCalled();
		expect(input.getAttribute("aria-invalid")).toBe("true");
		expect(screen.getByRole("alert").textContent).toContain("Enter a 6-digit hex color.");
	});

	it("resets uncontrolled and controlled values through the owner callback", async () => {
		const onValueChange = vi.fn();
		render(<AccentColorPicker defaultValue="#7c3aed" onValueChange={onValueChange} />);
		fireEvent.click(screen.getByRole("button", { name: "Change accent color" }));
		fireEvent.click(await screen.findByRole("button", { name: /Reset/ }));
		expect(onValueChange).toHaveBeenLastCalledWith(DEFAULT_ACCENT_COLOR);

		cleanup();
		render(<AccentColorPicker onValueChange={onValueChange} value="#7c3aed" />);
		fireEvent.click(screen.getByRole("button", { name: "Change accent color" }));
		fireEvent.click(await screen.findByRole("button", { name: /Reset/ }));
		expect(screen.getByRole("status").textContent).toBe("#7C3AED");
	});
});

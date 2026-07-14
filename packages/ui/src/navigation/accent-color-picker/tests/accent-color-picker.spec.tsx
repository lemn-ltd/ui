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
});

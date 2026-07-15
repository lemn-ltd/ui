import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BarList } from "../bar-list.js";

describe("BarList", () => {
	afterEach(() => cleanup());

	it("uses semantic links and buttons for interactive rows", () => {
		const onSelect = vi.fn();
		const { getByRole } = render(
			<BarList
				aria-label="Top pages"
				items={[
					{ href: "/docs", label: "Docs", value: 80 },
					{ label: "Dashboard", onSelect, value: 40 },
				]}
			/>,
		);
		expect(getByRole("link", { name: /Docs 80/ })).toBeTruthy();
		fireEvent.click(getByRole("button", { name: /Dashboard 40/ }));
		expect(onSelect).toHaveBeenCalledOnce();
	});

	it("sorts values and reports parent-level selection", () => {
		const onValueChange = vi.fn();
		const { container, getAllByRole } = render(
			<BarList
				animation="none"
				aria-label="Top pages"
				items={[
					{ label: "Low", value: 10 },
					{ label: "High", value: 90 },
				]}
				onValueChange={onValueChange}
			/>,
		);
		const buttons = getAllByRole("button");
		expect(buttons[0]?.textContent).toContain("High");
		fireEvent.click(buttons[1] as HTMLElement);
		expect(onValueChange).toHaveBeenCalledWith(
			expect.objectContaining({ label: "Low" }),
		);
		expect(
			container.querySelector("ol")?.getAttribute("data-animation-active"),
		).toBe("false");
	});
});

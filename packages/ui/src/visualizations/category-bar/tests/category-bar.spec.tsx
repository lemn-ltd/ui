import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CategoryBar } from "../category-bar.js";

describe("CategoryBar", () => {
	afterEach(() => cleanup());

	it("pairs every segment with a visible label and value", () => {
		const { getByText } = render(
			<CategoryBar
				aria-label="Issue distribution"
				items={[
					{ label: "Open", value: 3 },
					{ label: "Closed", value: 7 },
				]}
			/>,
		);
		expect(getByText("Open")).toBeTruthy();
		expect(getByText("7")).toBeTruthy();
	});

	it("renders cumulative labels and an accessible clamped marker", () => {
		const { getByRole, getByText } = render(
			<CategoryBar
				aria-label="Capacity"
				items={[
					{ label: "Used", value: 40 },
					{ label: "Free", value: 60 },
				]}
				marker={{ animation: "none", tooltip: "Current capacity", value: 45 }}
			/>,
		);
		expect(getByText("100")).toBeTruthy();
		expect(
			getByRole("img", { name: "Current capacity" }).getAttribute("style"),
		).toContain("45%");
	});
});

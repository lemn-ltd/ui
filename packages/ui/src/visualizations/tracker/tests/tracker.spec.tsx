import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Tracker } from "../tracker.js";

describe("Tracker", () => {
	afterEach(() => cleanup());

	it("announces every discrete state without relying on color", () => {
		const { getByText } = render(
			<Tracker
				aria-label="Run status"
				items={[
					{ label: "Build", status: "complete" },
					{ label: "Deploy", status: "error" },
				]}
			/>,
		);
		expect(getByText(/Build: complete/)).toBeTruthy();
		expect(getByText(/Deploy: error/)).toBeTruthy();
	});

	it("supports custom token colors, tooltips, and hover treatment", () => {
		const { container, getByTitle } = render(
			<Tracker
				aria-label="Run status"
				hoverEffect
				items={[
					{
						color: "var(--chart-series-2)",
						label: "Deploy",
						tooltip: "Deploying now",
					},
				]}
			/>,
		);
		expect(getByTitle("Deploying now").getAttribute("data-custom-color")).toBe(
			"true",
		);
		expect(
			container.querySelector("ol")?.getAttribute("data-hover-effect"),
		).toBe("true");
	});
});

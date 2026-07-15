import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
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

	it("retains Tremor's click-to-open HoverCard while applying token colors", async () => {
		const { container, getByRole, getByText } = render(
			<Tracker
				aria-label="Run status"
				hoverEffect
				items={[
					{
						color: "var(--lemn-chart-series-2)",
						label: "Deploy",
						tooltip: "Deploying now",
					},
				]}
			/>,
		);
		const item = getByRole("listitem");
		expect(item.getAttribute("data-custom-color")).toBe("true");
		expect(item.getAttribute("data-status")).toBe("pending");
		expect(
			item.querySelector<HTMLElement>(".ui-tracker-provider__block")?.style.getPropertyValue(
				"--ui-tracker-color",
			),
		).toBe("var(--lemn-chart-series-2)");
		expect(
			container.querySelector("ol")?.getAttribute("data-hover-effect"),
		).toBe("true");

		fireEvent.click(item);
		await waitFor(() => expect(getByText("Deploying now")).toBeTruthy());
		expect(item.getAttribute("aria-describedby")).toBeTruthy();
	});

	it("renders a semantic, branded-first server snapshot", () => {
		const html = renderToString(
			<Tracker
				aria-label="Run status"
				items={[
					{ label: "Build", status: "complete" },
					{ label: "Deploy", status: "active", tooltip: "Deploying" },
				]}
			/>,
		);
		expect(html).toContain('aria-label="Run status"');
		expect(html).toContain("ui-tracker-provider__block--complete");
		expect(html).toContain("Build: complete.");
		expect(html).toContain("Deploy: active.");
		expect(html).not.toContain("bg-gray-");
	});
});

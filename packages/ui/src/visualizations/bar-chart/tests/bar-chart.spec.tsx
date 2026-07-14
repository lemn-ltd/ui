import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
	BAR_CHART_LABEL_MARK_LIMIT,
	BarChart,
	barChartLabelsAreVisible,
} from "../bar-chart.js";

describe("BarChart", () => {
	afterEach(() => cleanup());

	it("reports horizontal stacked semantics", () => {
		const { getByText } = render(
			<BarChart
				aria-label="Requests"
				data={[{ route: "/v1", success: 12, failure: -2 }]}
				index="route"
				orientation="horizontal"
				series={[
					{ dataKey: "success", name: "Success" },
					{ dataKey: "failure", name: "Failure" },
				]}
				stacked
			/>,
		);
		expect(getByText(/2 stacked horizontal bar series/)).toBeTruthy();
	});

	it("shows short labels for representative vertical and horizontal datasets", () => {
		const data = [{ category: "A", value: 12 }];
		const series = [{ dataKey: "value" as const, name: "Value" }];
		expect(barChartLabelsAreVisible(data, series, true)).toBe(true);
		const { rerender, container } = render(
			<BarChart
				aria-label="Vertical"
				data={data}
				index="category"
				series={series}
				showLabels
			/>,
		);
		expect(
			container
				.querySelector(".ui-chart-visualization")
				?.getAttribute("data-label-policy"),
		).toBe("visible");
		rerender(
			<BarChart
				aria-label="Horizontal"
				data={data}
				index="category"
				orientation="horizontal"
				series={series}
				showLabels
			/>,
		);
		expect(
			container
				.querySelector(".ui-chart-visualization")
				?.getAttribute("data-label-policy"),
		).toBe("visible");
	});

	it("suppresses labels for dense data and long formatted values", () => {
		const denseData = Array.from(
			{ length: BAR_CHART_LABEL_MARK_LIMIT + 1 },
			(_, index) => ({
				category: `C${index}`,
				value: index,
			}),
		);
		const series = [{ dataKey: "value" as const, name: "Value" }];
		expect(barChartLabelsAreVisible(denseData, series, true)).toBe(false);
		expect(
			barChartLabelsAreVisible(
				[{ category: "A", value: 12 }],
				[{ ...series[0], valueFormatter: () => "A label that cannot fit" }],
				true,
			),
		).toBe(false);
	});
});

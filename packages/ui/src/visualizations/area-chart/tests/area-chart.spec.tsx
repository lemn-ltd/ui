import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AreaChart } from "../area-chart.js";

describe("AreaChart", () => {
	afterEach(() => cleanup());

	it("describes stacked series and uses collision-safe gradient ids", () => {
		const props = {
			data: [{ month: "Jan", active: 12 }],
			index: "month" as const,
			series: [{ dataKey: "active" as const, name: "Active" }],
			stacked: true,
		};
		const { container, getAllByText } = render(
			<>
				<AreaChart aria-label="First" {...props} />
				<AreaChart aria-label="Second" {...props} />
			</>,
		);
		expect(getAllByText(/1 stacked area series/)).toHaveLength(2);
		const ids = [...container.querySelectorAll("linearGradient")].map(
			(node) => node.id,
		);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("supports percent mode, axis labels, and a scrollable keyboard legend", () => {
		const { getByRole, getByText } = render(
			<AreaChart
				aria-label="Share"
				data={[
					{ month: "Jan", active: 12, idle: 8 },
					{ month: "Feb", active: 14, idle: 6 },
				]}
				index="month"
				legendOverflow="scroll"
				mode="percent"
				series={[
					{ dataKey: "active", name: "Active" },
					{ dataKey: "idle", name: "Idle" },
				]}
				xAxis={{ label: "Month", startEndOnly: true }}
				yAxis={{ label: "Share" }}
			/>,
		);
		expect(getByText(/2 percent area series/)).toBeTruthy();
		expect(
			getByRole("region", { name: "Scrollable chart series" }),
		).toBeTruthy();
	});
});

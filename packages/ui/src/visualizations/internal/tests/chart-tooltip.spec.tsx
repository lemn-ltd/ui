import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChartTooltipContent } from "../chart-tooltip.js";

describe("ChartTooltipContent", () => {
	afterEach(() => cleanup());

	it("normalizes renderer payloads for callbacks and custom content", async () => {
		const onChange = vi.fn();
		const datum = { month: "Jan", revenue: 42 };
		const { getByText } = render(
			<ChartTooltipContent
				active
				label="Jan"
				onChange={onChange}
				payload={[{ dataKey: "revenue", payload: datum, value: 42 }]}
				render={(context) => (
					<span>{`${context.label}: ${context.entries[0]?.value}`}</span>
				)}
				series={[{ dataKey: "revenue", name: "Revenue" }]}
			/>,
		);

		expect(getByText("Jan: 42")).toBeTruthy();
		await waitFor(() =>
			expect(onChange).toHaveBeenCalledWith(
				expect.objectContaining({
					active: true,
					entries: [
						expect.objectContaining({
							dataKey: "revenue",
							datum,
							name: "Revenue",
							value: 42,
						}),
					],
					label: "Jan",
				}),
			),
		);
	});
});

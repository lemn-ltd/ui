import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SparkChart } from "../spark-chart.js";

describe("SparkChart", () => {
	afterEach(() => cleanup());

	it.each([
		"line",
		"area",
		"bar",
	] as const)("renders the %s capability", (kind) => {
		const { getByText } = render(
			<SparkChart
				aria-label={`${kind} requests`}
				data={[{ minute: "00", requests: 10 }]}
				dataKey="requests"
				index="minute"
				kind={kind}
				name="Requests"
			/>,
		);
		expect(getByText(new RegExp(`compact ${kind} chart`))).toBeTruthy();
	});

	it("renders multiple series through the provider-neutral series contract", () => {
		const { getByText } = render(
			<SparkChart
				aria-label="Requests and errors"
				data={[{ minute: "00", errors: 2, requests: 10 }]}
				index="minute"
				kind="area"
				mode="stacked"
				series={[
					{ dataKey: "requests", name: "Requests" },
					{ dataKey: "errors", name: "Errors" },
				]}
			/>,
		);
		expect(getByText(/Requests, Errors compact area chart/)).toBeTruthy();
	});
});

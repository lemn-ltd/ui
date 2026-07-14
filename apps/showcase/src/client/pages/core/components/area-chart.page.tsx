import { AreaChart, type AreaChartProps } from "@lemn-ltd/ui";
import type { ReactElement } from "react";
import { monthlyReportData } from "../../../fixtures/index.js";
import {
	defineVisualizationApiRows,
	VISUALIZATION_PREVIEW_STYLE,
	VisualizationDocs,
} from "./visualization-docs.js";

const API_ROWS = defineVisualizationApiRows<
	AreaChartProps<(typeof monthlyReportData)[number]>
>()([
	{
		prop: "data",
		type: "readonly TDatum[]",
		description: "Prepared chart rows.",
	},
	{
		prop: "index",
		type: "keyof TDatum",
		description: "Categorical axis field.",
	},
	{
		prop: "series",
		type: "readonly ChartSeries<TDatum>[]",
		description: "Named area series.",
	},
	{
		prop: "stacked",
		type: "boolean",
		defaultValue: "false",
		description: "Stacks the declared series.",
	},
	{
		prop: "fill",
		type: "'solid' | 'gradient'",
		defaultValue: "'gradient'",
		description: "Token-driven area fill.",
	},
	{
		prop: "animation",
		type: "'auto' | 'none'",
		defaultValue: "'auto'",
		description: "Disables motion for dense or reduced-motion contexts.",
	},
	{
		prop: "showGrid",
		type: "boolean",
		defaultValue: "true",
		description: "Shows horizontal reference lines.",
	},
	{
		prop: "showLegend",
		type: "boolean",
		defaultValue: "true",
		description: "Shows keyboard-operable series controls.",
	},
	{
		prop: "showTooltip",
		type: "boolean",
		defaultValue: "true",
		description: "Shows pointer and keyboard value details.",
	},
]);

const CODE = `import { AreaChart } from '@lemn-ltd/ui';

<AreaChart
  aria-label="Revenue and expenses by month"
  data={monthlyReportData}
  index="month"
  series={[
    { dataKey: 'revenue', name: 'Revenue' },
    { dataKey: 'expenses', name: 'Expenses' },
  ]}
  stacked
/>`;

function AreaChartPage(): ReactElement {
	return (
		<VisualizationDocs
			apiRows={API_ROWS}
			code={CODE}
			componentName="AreaChart"
			render={() => (
				<div style={VISUALIZATION_PREVIEW_STYLE}>
					<AreaChart
						animation="none"
						aria-label="Revenue and expenses by month"
						data={monthlyReportData}
						index="month"
						series={[
							{ dataKey: "revenue", name: "Revenue" },
							{ dataKey: "expenses", name: "Expenses" },
						]}
						stacked
					/>
				</div>
			)}
			summary="Show the magnitude of one or more normal or stacked series over an ordered dimension."
			title="Area chart"
		/>
	);
}

export default AreaChartPage;

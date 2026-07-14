import { BarChart, type BarChartProps } from "@lemn-ltd/ui";
import type { ReactElement } from "react";
import { monthlyReportData } from "../../../fixtures/index.js";
import {
	defineVisualizationApiRows,
	VISUALIZATION_PREVIEW_STYLE,
	VisualizationDocs,
} from "./visualization-docs.js";

const API_ROWS = defineVisualizationApiRows<
	BarChartProps<(typeof monthlyReportData)[number]>
>()([
	{
		prop: "data",
		type: "readonly TDatum[]",
		description: "Prepared categorical rows.",
	},
	{ prop: "index", type: "keyof TDatum", description: "Category field." },
	{
		prop: "series",
		type: "readonly ChartSeries<TDatum>[]",
		description: "Named numeric series.",
	},
	{
		prop: "animation",
		type: "'auto' | 'none'",
		defaultValue: "'auto'",
		description:
			"Animates only when motion is allowed and mark count is representative.",
	},
	{
		prop: "orientation",
		type: "'vertical' | 'horizontal'",
		defaultValue: "'vertical'",
		description: "Direction of the rendered bars.",
	},
	{
		prop: "stacked",
		type: "boolean",
		defaultValue: "false",
		description: "Stacks series instead of grouping them.",
	},
	{
		prop: "showGrid",
		type: "boolean",
		defaultValue: "true",
		description: "Shows reference lines for the numeric axis.",
	},
	{
		prop: "showLabels",
		type: "boolean",
		defaultValue: "false",
		description:
			"Shows labels only for at most 24 short marks; dense or long labels stay in the tooltip and summary.",
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
		description:
			"Shows value details without making them the only data channel.",
	},
]);

const CODE = `import { BarChart } from '@lemn-ltd/ui';

<BarChart
  aria-label="Revenue and expenses by month"
  data={monthlyReportData}
  index="month"
  series={[
    { dataKey: 'revenue', name: 'Revenue' },
    { dataKey: 'expenses', name: 'Expenses' },
  ]}
/>`;

function BarChartPage(): ReactElement {
	return (
		<VisualizationDocs
			apiRows={API_ROWS}
			code={CODE}
			componentName="BarChart"
			render={() => (
				<div style={VISUALIZATION_PREVIEW_STYLE}>
					<BarChart
						animation="none"
						aria-label="Revenue and expenses by month"
						data={monthlyReportData}
						index="month"
						series={[
							{ dataKey: "revenue", name: "Revenue" },
							{ dataKey: "expenses", name: "Expenses" },
						]}
					/>
				</div>
			)}
			summary="Compare categorical values as grouped or stacked bars in vertical or horizontal layouts."
			title="Bar chart"
		/>
	);
}

export default BarChartPage;

import { ComboChart, type ComboChartProps } from "@lemn-ltd/ui";
import type { ReactElement } from "react";
import { monthlyReportData } from "../../../fixtures/index.js";
import {
	defineVisualizationApiRows,
	VISUALIZATION_PREVIEW_STYLE,
	VisualizationDocs,
} from "./visualization-docs.js";

const API_ROWS = defineVisualizationApiRows<
	ComboChartProps<(typeof monthlyReportData)[number]>
>()([
	{
		prop: "data",
		type: "readonly TDatum[]",
		description: "Prepared chart rows shared by bar and line series.",
	},
	{
		prop: "index",
		type: "keyof TDatum",
		description: "Categorical axis field.",
	},
	{
		prop: "series",
		type: "readonly ComboChartSeries<TDatum>[]",
		description:
			"Declared bar or line geometry and optional primary or secondary axis.",
	},
	{
		prop: "showLegend",
		type: "boolean",
		defaultValue: "true",
		description: "Shows keyboard-operable series controls.",
	},
	{
		prop: "animation",
		type: "'auto' | 'none'",
		defaultValue: "'auto'",
		description: "Respects reduced motion and disables dense animation.",
	},
	{
		prop: "showGrid",
		type: "boolean",
		defaultValue: "true",
		description: "Shows horizontal reference lines.",
	},
	{
		prop: "showTooltip",
		type: "boolean",
		defaultValue: "true",
		description: "Uses one tooltip for all declared series.",
	},
]);

const CODE = `import { ComboChart } from '@lemn-ltd/ui';

<ComboChart
  aria-label="Revenue and conversion by month"
  data={monthlyReportData}
  index="month"
  series={[
    { dataKey: 'revenue', kind: 'bar', name: 'Revenue' },
    { axis: 'secondary', dataKey: 'conversion', kind: 'line', name: 'Conversion' },
  ]}
/>`;

function ComboChartPage(): ReactElement {
	return (
		<VisualizationDocs
			apiRows={API_ROWS}
			code={CODE}
			componentName="ComboChart"
			render={() => (
				<div style={VISUALIZATION_PREVIEW_STYLE}>
					<ComboChart
						animation="none"
						aria-label="Revenue and conversion by month"
						data={monthlyReportData}
						index="month"
						series={[
							{ dataKey: "revenue", kind: "bar", name: "Revenue" },
							{
								axis: "secondary",
								dataKey: "conversion",
								kind: "line",
								name: "Conversion",
							},
						]}
					/>
				</div>
			)}
			summary="Combine approved bar and line series while keeping one unified legend and tooltip."
			title="Combo chart"
		/>
	);
}

export default ComboChartPage;

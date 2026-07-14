import { DocumentationSection, ExampleBlock } from "@lemn-ltd/showcase-kit";
import { LineChart, type LineChartProps } from "@lemn-ltd/ui";
import type { ReactElement } from "react";
import { monthlyReportData } from "../../../fixtures/index.js";
import {
	defineVisualizationApiRows,
	VISUALIZATION_PREVIEW_STYLE,
	VisualizationDocs,
} from "./visualization-docs.js";

const API_ROWS = defineVisualizationApiRows<
	LineChartProps<(typeof monthlyReportData)[number]>
>()([
	{
		prop: "data",
		type: "readonly TDatum[]",
		description: "Prepared chart rows.",
	},
	{
		prop: "index",
		type: "keyof TDatum",
		description: "Categorical x-axis field.",
	},
	{
		prop: "series",
		type: "readonly ChartSeries<TDatum>[]",
		description: "Named numeric series.",
	},
	{
		prop: "animation",
		type: "'auto' | 'none'",
		defaultValue: "'auto'",
		description: "Respects reduced motion and disables dense animation.",
	},
	{
		prop: "connectNulls",
		type: "boolean",
		defaultValue: "false",
		description: "Connects across null points only when explicitly requested.",
	},
	{
		prop: "curve",
		type: "'linear' | 'monotone' | 'step'",
		defaultValue: "'monotone'",
		description: "Limited curve vocabulary owned by Lemn UI.",
	},
	{
		prop: "showDots",
		type: "boolean",
		defaultValue: "false",
		description: "Shows a marker for every rendered point.",
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
		description: "Shows formatted point details.",
	},
]);

const CODE = `import { LineChart } from '@lemn-ltd/ui';

<LineChart
  aria-label="Revenue and expenses by month"
  data={monthlyReportData}
  index="month"
  series={[
    { dataKey: 'revenue', name: 'Revenue' },
    { dataKey: 'expenses', name: 'Expenses' },
  ]}
/>`;

function LineChartPage(): ReactElement {
	return (
		<VisualizationDocs
			apiRows={API_ROWS}
			code={CODE}
			componentName="LineChart"
			render={() => (
				<div style={VISUALIZATION_PREVIEW_STYLE}>
					<LineChart
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
			summary="Compare one or more series over an ordered dimension with accessible legend controls and tooltips."
			title="Line chart"
		>
			<DocumentationSection
				description={
					<p>
						Loading, empty, and recoverable error states use the same
						engine-independent frame.
					</p>
				}
				title="Example: States"
			>
				<ExampleBlock
					code={`import { LineChart } from '@lemn-ltd/ui';\n\n<LineChart aria-label="Revenue" data={[]} emptyMessage="No revenue yet" index="month" series={[]} />`}
					presentation="documentation"
					render={() => (
						<div style={VISUALIZATION_PREVIEW_STYLE}>
							<LineChart
								aria-label="Revenue"
								data={[]}
								emptyMessage="No revenue yet"
								index="month"
								series={[]}
							/>
						</div>
					)}
				/>
			</DocumentationSection>
		</VisualizationDocs>
	);
}

export default LineChartPage;

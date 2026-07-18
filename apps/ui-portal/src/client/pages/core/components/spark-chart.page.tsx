import { SparkChart, type SparkChartProps } from "@lemn-ltd/ui";
import type { ReactElement } from "react";
import { monthlyReportData } from "../../../fixtures/index.js";
import {
	defineVisualizationApiRows,
	VISUALIZATION_PREVIEW_STYLE,
	VisualizationDocs,
} from "./visualization-docs.js";

const API_ROWS = defineVisualizationApiRows<
	SparkChartProps<(typeof monthlyReportData)[number]>
>()([
	{
		prop: "data",
		type: "readonly TDatum[]",
		description: "Prepared compact-series rows.",
	},
	{
		prop: "series",
		type: "readonly ChartSeries<TDatum>[]",
		description:
			"Multiple compact series; replaces the single-series compatibility props.",
	},
	{
		prop: "kind",
		type: "'line' | 'area' | 'bar'",
		defaultValue: "'line'",
		description: "Approved compact geometry.",
	},
	{
		prop: "mode",
		type: "'default' | 'stacked' | 'percent'",
		defaultValue: "'default'",
		description: "Stacks or normalizes area and bar series.",
	},
	{
		prop: "fill",
		type: "'solid' | 'gradient' | 'none'",
		defaultValue: "'solid'",
		description: "Controls compact area fill.",
	},
	{
		prop: "connectNulls",
		type: "boolean",
		defaultValue: "false",
		description: "Connects line and area values across null gaps.",
	},
	{
		prop: "domain",
		type: "ChartValueDomain",
		description: "Configures the hidden numeric domain.",
	},
	{
		prop: "barCategoryGap",
		type: "number | string",
		description: "Controls compact bar category spacing.",
	},
	{
		prop: "dataKey",
		type: "keyof TDatum",
		description: "Numeric value field.",
	},
	{ prop: "index", type: "keyof TDatum", description: "Tooltip label field." },
	{
		prop: "name",
		type: "string",
		description: "Human-readable series name used by summary and tooltip.",
	},
	{
		prop: "animation",
		type: "'auto' | 'none'",
		defaultValue: "'auto'",
		description: "Respects reduced motion and disables dense animation.",
	},
	{
		prop: "color",
		type: "ChartColor",
		description:
			"Optional Lemn token reference; renderer colors are not accepted.",
	},
	{
		prop: "showTooltip",
		type: "boolean",
		defaultValue: "true",
		description: "Shows compact value details.",
	},
	{
		prop: "onTooltipChange",
		type: "(context: ChartTooltipContext<TDatum> | null) => void",
		description: "Reports normalized tooltip lifecycle changes.",
	},
	{
		prop: "renderTooltip",
		type: "(context: ChartTooltipContext<TDatum>) => ReactNode",
		description: "Renders custom normalized tooltip content.",
	},
	{
		prop: "valueFormatter",
		type: "(value: number) => string",
		description: "Formats tooltip values.",
	},
]);

const CODE = `import { SparkChart } from '@lemn-ltd/ui';

<SparkChart
  aria-label="Monthly revenue and expense trend"
  data={monthlyReportData}
  index="month"
  kind="area"
  fill="gradient"
  series={[
    { dataKey: 'revenue', name: 'Revenue' },
    { dataKey: 'expenses', name: 'Expenses' },
  ]}
/>`;

function SparkChartPage(): ReactElement {
	return (
		<VisualizationDocs
			apiRows={API_ROWS}
			code={CODE}
			componentName="SparkChart"
			defaultHeight="96"
			render={() => (
				<div style={VISUALIZATION_PREVIEW_STYLE}>
					<SparkChart
						animation="none"
						aria-label="Monthly revenue and expense trend"
						data={monthlyReportData}
						fill="gradient"
						index="month"
						kind="area"
						series={[
							{ dataKey: "revenue", name: "Revenue" },
							{ dataKey: "expenses", name: "Expenses" },
						]}
					/>
				</div>
			)}
			summary="Add optional tooltip interaction to a compact line, area, or bar report visualization."
			title="Spark chart"
		/>
	);
}

export default SparkChartPage;

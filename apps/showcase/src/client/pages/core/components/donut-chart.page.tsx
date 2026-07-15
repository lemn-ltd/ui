import { DonutChart, type DonutChartProps } from "@lemn-ltd/ui";
import { type ReactElement, useState } from "react";
import { trafficSources } from "../../../fixtures/index.js";
import {
	defineVisualizationApiRows,
	VISUALIZATION_PREVIEW_STYLE,
	VisualizationDocs,
} from "./visualization-docs.js";

const API_ROWS = defineVisualizationApiRows<DonutChartProps>()([
	{
		prop: "data",
		type: "readonly DonutChartDatum[]",
		description: "Labelled non-negative segment values.",
	},
	{
		prop: "variant",
		type: "'donut' | 'pie'",
		defaultValue: "'donut'",
		description: "Renders a ring or full pie geometry.",
	},
	{
		prop: "animation",
		type: "'auto' | 'none'",
		defaultValue: "'auto'",
		description: "Respects reduced motion and disables dense animation.",
	},
	{
		prop: "label",
		type: "string",
		description: "Compatibility label shown in the center of a donut.",
	},
	{
		prop: "centerLabel",
		type: "string",
		description: "Optional text centered inside the ring.",
	},
	{
		prop: "showLabel",
		type: "boolean",
		defaultValue: "true",
		description: "Controls central label visibility for the donut variant.",
	},
	{
		prop: "valueFormatter",
		type: "(value: number) => string",
		description: "Formats tooltip, legend, and summary values.",
	},
	{
		prop: "showLegend",
		type: "boolean",
		defaultValue: "true",
		description: "Shows labelled segment controls.",
	},
	{
		prop: "legendPosition",
		type: "'left' | 'center' | 'right'",
		defaultValue: "'right'",
		description: "Aligns the series legend.",
	},
	{
		prop: "legendOverflow",
		type: "'wrap' | 'scroll'",
		defaultValue: "'wrap'",
		description: "Wraps or horizontally scrolls long legends.",
	},
	{
		prop: "showTooltip",
		type: "boolean",
		defaultValue: "true",
		description: "Shows formatted segment details.",
	},
	{
		prop: "onValueChange",
		type: "(selection: DonutChartSelection) => void",
		description: "Makes segments selectable and emits null when cleared.",
	},
	{
		prop: "onTooltipChange",
		type: "(context: DonutChartTooltipContext | null) => void",
		description: "Reports normalized tooltip lifecycle changes.",
	},
	{
		prop: "renderTooltip",
		type: "(context: DonutChartTooltipContext) => ReactNode",
		description:
			"Renders custom content from the normalized Lemn tooltip context.",
	},
]);

const CODE = `import { DonutChart } from '@lemn-ltd/ui';

<DonutChart
  aria-label="Traffic sources"
  centerLabel="100%"
  data={trafficSources}
  legendOverflow="scroll"
  onValueChange={setSelection}
/>`;

function DonutChartPreview(): ReactElement {
	const [selection, setSelection] = useState("No segment selected");
	return (
		<div style={VISUALIZATION_PREVIEW_STYLE}>
			<DonutChart
				animation="none"
				aria-label="Traffic sources"
				centerLabel="100%"
				data={trafficSources}
				legendOverflow="scroll"
				onValueChange={(value) =>
					setSelection(value ? value.item.label : "No segment selected")
				}
			/>
			<output aria-live="polite">Selection: {selection}</output>
		</div>
	);
}

function DonutChartPage(): ReactElement {
	return (
		<VisualizationDocs
			apiRows={API_ROWS}
			code={CODE}
			componentName="DonutChart"
			render={() => <DonutChartPreview />}
			summary="Explain a labelled part-to-whole distribution with an explicit zero-total state."
			title="Donut chart"
		/>
	);
}

export default DonutChartPage;

import { DonutChart, type DonutChartProps } from "@lemn-ltd/ui";
import type { ReactElement } from "react";
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
		prop: "animation",
		type: "'auto' | 'none'",
		defaultValue: "'auto'",
		description: "Respects reduced motion and disables dense animation.",
	},
	{
		prop: "centerLabel",
		type: "string",
		description: "Optional text centered inside the ring.",
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
		prop: "showTooltip",
		type: "boolean",
		defaultValue: "true",
		description: "Shows formatted segment details.",
	},
]);

const CODE = `import { DonutChart } from '@lemn-ltd/ui';

<DonutChart
  aria-label="Traffic sources"
  centerLabel="100%"
  data={trafficSources}
/>`;

function DonutChartPage(): ReactElement {
	return (
		<VisualizationDocs
			apiRows={API_ROWS}
			code={CODE}
			componentName="DonutChart"
			render={() => (
				<div style={VISUALIZATION_PREVIEW_STYLE}>
					<DonutChart
						animation="none"
						aria-label="Traffic sources"
						centerLabel="100%"
						data={trafficSources}
					/>
				</div>
			)}
			summary="Explain a labelled part-to-whole distribution with an explicit zero-total state."
			title="Donut chart"
		/>
	);
}

export default DonutChartPage;

import {
	ComponentPage,
	ExampleBlock,
	PropsTable,
} from "@lemn-ltd/showcase-kit";
import { HeatmapChart } from "@lemn-ltd/ui";
import { type ReactElement, useState } from "react";

const DATA = [
	{ x: "Mon", y: "Morning", value: 18 },
	{ x: "Tue", y: "Morning", value: 26 },
	{ x: "Wed", y: "Morning", value: 34 },
	{ x: "Thu", y: "Morning", value: 22 },
	{ x: "Fri", y: "Morning", value: 41 },
	{ x: "Mon", y: "Afternoon", value: 31 },
	{ x: "Tue", y: "Afternoon", value: 44 },
	{ x: "Wed", y: "Afternoon", value: 38 },
	{ x: "Thu", y: "Afternoon", value: 49 },
	{ x: "Fri", y: "Afternoon", value: 36 },
];

const CODE = `const cells = [
  { x: 'Mon', y: 'Morning', value: 18 },
  { x: 'Tue', y: 'Morning', value: 26 },
  { x: 'Mon', y: 'Afternoon', value: 31 },
];

<HeatmapChart
  aria-label="Appointment demand"
  data={cells}
  onValueChange={setCell}
  showVisualMap
  xLabel="Day"
  yLabel="Session"
/>`;

function InteractiveHeatmap(): ReactElement {
	const [selection, setSelection] = useState("Select a cell");
	return (
		<div className="showcase-heatmap-preview">
			<HeatmapChart
				aria-label="Appointment demand"
				data={DATA}
				onValueChange={(cell) =>
					setSelection(`${cell.x} · ${cell.y}: ${cell.value}`)
				}
				showVisualMap
				xLabel="Day"
				yLabel="Session"
			/>
			<output aria-live="polite">{selection}</output>
		</div>
	);
}

export default function HeatmapChartPage(): ReactElement {
	return (
		<ComponentPage
			status="beta"
			summary="Render categorical intensity with ECharts while consuming the same BrandProject chart tokens as Recharts components."
			title="Heatmap chart"
		>
			<ExampleBlock code={CODE} render={() => <InteractiveHeatmap />} />
			<ExampleBlock
				code={'<HeatmapChart aria-label="No demand" data={[]} emptyMessage="No observations yet" />'}
				render={() => (
					<HeatmapChart
						aria-label="No demand"
						data={[]}
						emptyMessage="No observations yet"
					/>
				)}
			/>
			<PropsTable
				rows={[
					{ name: "data", type: "readonly HeatmapChartDatum[]", description: "Categorical cells with x, y, and numeric value." },
					{ name: "onValueChange", type: "(datum) => void", description: "Emits the selected cell." },
					{ name: "showTooltip", type: "boolean", defaultValue: "true", description: "Shows provider-owned item details." },
					{ name: "showVisualMap", type: "boolean", defaultValue: "true", description: "Shows the branded intensity scale." },
				]}
			/>
		</ComponentPage>
	);
}

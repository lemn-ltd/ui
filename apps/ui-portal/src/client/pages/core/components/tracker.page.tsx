import { Tracker } from "@lemn-ltd/ui";
import type { ReactElement } from "react";
import { runStates } from "../../../fixtures/index.js";
import {
	VISUALIZATION_PREVIEW_STYLE,
	VisualizationDocs,
} from "./visualization-docs.js";

const CODE = `import { Tracker } from '@lemn-ltd/ui';

<Tracker
  aria-label="Run lifecycle"
  items={runStates}
/>`;

function TrackerPage(): ReactElement {
	return (
		<VisualizationDocs
			apiRows={[
				{
					prop: "defaultColor",
					type: "ChartColor",
					description:
						"Optional token color for items without their own color.",
				},
				{
					prop: "hoverEffect",
					type: "boolean",
					defaultValue: "false",
					description:
						"Highlights the hovered block while respecting reduced motion.",
				},
				{
					prop: "items",
					type: "readonly TrackerItem[]",
					description: "Ordered labels, statuses, and optional descriptions.",
				},
				{
					prop: "items[].status / color / tooltip",
					type: "'complete' | 'active' | 'pending' | 'error'",
					description:
						"Text-backed status plus optional token color and tooltip copy.",
				},
				{
					prop: "aria-label",
					type: "string",
					description: "Accessible sequence name; use this or aria-labelledby.",
				},
				{
					prop: "aria-labelledby",
					type: "string",
					description: "ID of an external sequence label.",
				},
				{
					prop: "className",
					type: "string",
					description: "Additional class names applied to the ordered list.",
				},
				{
					prop: "native ol attributes",
					type: "HTMLAttributes<HTMLOListElement>",
					description:
						"Safe native list attributes except children and accessible-name conflicts.",
				},
			]}
			code={CODE}
			componentName="Tracker"
			includeChartStateApi={false}
			render={() => (
				<div style={VISUALIZATION_PREVIEW_STYLE}>
					<Tracker aria-label="Run lifecycle" hoverEffect items={runStates} />
				</div>
			)}
			summary="Tremor's pinned Tracker and HoverCard behavior behind a semantic LEMN adapter, using patterns and hidden text as well as color."
			title="Tracker"
		/>
	);
}

export default TrackerPage;

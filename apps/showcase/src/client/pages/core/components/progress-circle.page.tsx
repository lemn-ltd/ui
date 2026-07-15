import { ProgressCircle } from "@lemn-ltd/ui";
import type { ReactElement } from "react";
import { VisualizationDocs } from "./visualization-docs.js";

const CODE = `import { ProgressCircle } from '@lemn-ltd/ui';

<ProgressCircle
  aria-label="Upload progress"
  label="72%"
  value={72}
/>`;

function ProgressCirclePage(): ReactElement {
	return (
		<VisualizationDocs
			apiRows={[
				{
					prop: "animation",
					type: "'auto' | 'none'",
					defaultValue: "'auto'",
					description:
						"Controls transitions and indeterminate motion while respecting reduced motion.",
				},
				{
					prop: "tone",
					type: "'default' | 'neutral' | 'warning' | 'error' | 'success'",
					defaultValue: "'default'",
					description: "Applies a semantic token color to the indicator.",
				},
				{
					prop: "value",
					type: "number",
					description: "Determinate value; omit for indeterminate progress.",
				},
				{
					prop: "max",
					type: "number",
					defaultValue: "100",
					description: "Upper bound for determinate progress.",
				},
				{
					prop: "children",
					type: "ReactNode",
					description: "Centered content; takes precedence over label.",
				},
				{
					prop: "label",
					type: "ReactNode",
					description: "Optional centered visual label.",
				},
				{
					prop: "size",
					type: "number",
					defaultValue: "64",
					description: "Native SVG width and height.",
				},
				{
					prop: "strokeWidth",
					type: "number",
					defaultValue: "6",
					description: "Track and indicator thickness.",
				},
				{
					prop: "aria-label",
					type: "string",
					description: "Accessible progress name; use this or aria-labelledby.",
				},
				{
					prop: "aria-labelledby",
					type: "string",
					description: "ID of an external progress label.",
				},
				{
					prop: "className",
					type: "string",
					description: "Additional class name on the progressbar.",
				},
				{
					prop: "style",
					type: "CSSProperties",
					description: "Additional outer styles; size still owns geometry.",
				},
				{
					prop: "native div attributes",
					type: "HTMLAttributes<HTMLDivElement>",
					description:
						"Safe native attributes except children, role, and accessible-name conflicts.",
				},
			]}
			code={CODE}
			componentName="ProgressCircle"
			includeChartStateApi={false}
			render={() => (
				<div
					style={{
						display: "flex",
						gap: "var(--space-6)",
						alignItems: "center",
					}}
				>
					<ProgressCircle aria-label="Upload progress" label="72%" value={72} />
					<ProgressCircle aria-label="Processing" tone="warning" />
				</div>
			)}
			summary="Represent determinate or indeterminate progress with native SVG and reduced-motion behavior."
			title="Progress circle"
		/>
	);
}

export default ProgressCirclePage;

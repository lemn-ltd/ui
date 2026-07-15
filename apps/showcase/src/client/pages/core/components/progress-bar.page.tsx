import { ProgressBar, type ProgressBarTone } from "@lemn-ltd/ui";
import type { ReactElement } from "react";
import { VisualizationDocs } from "./visualization-docs.js";

const TONES: readonly ProgressBarTone[] = [
	"default",
	"neutral",
	"warning",
	"error",
	"success",
];

const CODE = `import { ProgressBar } from '@lemn-ltd/ui';

<ProgressBar
  aria-label="Migration progress"
  label="36 of 48"
  max={48}
  tone="success"
  value={36}
/>`;

function ProgressBarPage(): ReactElement {
	return (
		<VisualizationDocs
			apiRows={[
				{
					prop: "variant",
					type: "'determinate' | 'indeterminate' | 'route'",
					defaultValue: "'determinate'",
					description: "Progress mode; only determinate reads value and max.",
				},
				{
					prop: "tone",
					type: "'default' | 'neutral' | 'warning' | 'error' | 'success'",
					defaultValue: "'default'",
					description: "Semantic token color for the fill.",
				},
				{
					prop: "animation",
					type: "'auto' | 'none'",
					defaultValue: "'auto'",
					description:
						"Controls transitions and loops while respecting reduced motion.",
				},
				{
					prop: "value",
					type: "number",
					defaultValue: "0",
					description: "Determinate value, clamped between zero and max.",
				},
				{
					prop: "max",
					type: "number",
					defaultValue: "100",
					description: "Upper bound and ARIA maximum for determinate progress.",
				},
				{
					prop: "label",
					type: "ReactNode",
					description: "Consumer-provided visible label.",
				},
				{
					prop: "showLabel",
					type: "boolean",
					defaultValue: "false",
					description:
						"Shows a calculated percentage when label is not supplied.",
				},
				{
					prop: "native div attributes",
					type: "Omit<HTMLAttributes<HTMLDivElement>, 'role'>",
					description:
						"Native div props; progress semantics are owned by the component.",
				},
			]}
			code={CODE}
			componentName="ProgressBar"
			includeChartStateApi={false}
			render={() => (
				<div
					style={{
						display: "grid",
						gap: "var(--space-4)",
						width: "min(520px, 100%)",
					}}
				>
					{TONES.map((tone, index) => (
						<ProgressBar
							aria-label={`${tone} progress`}
							key={tone}
							showLabel
							tone={tone}
							value={20 + index * 15}
						/>
					))}
					<ProgressBar
						aria-label="Loading"
						tone="neutral"
						variant="indeterminate"
					/>
				</div>
			)}
			summary="Represent bounded, indeterminate, or route progress with semantic tones and reduced-motion behavior."
			title="Progress bar"
		/>
	);
}

export default ProgressBarPage;

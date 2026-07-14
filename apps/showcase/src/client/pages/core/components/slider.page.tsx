import { Slider } from "@lemn-ltd/ui";
import { type ReactElement, useState } from "react";
import { CAPABILITY_PREVIEW_STYLE, CapabilityDocs } from "./capability-docs.js";

const CODE = `import { Slider } from '@lemn-ltd/ui';

<Slider
  aria-labels={['Minimum score', 'Maximum score']}
  defaultValue={[25, 80]}
  valueFormatter={(value) => \`\${value}%\`}
/>`;

function SliderExample(): ReactElement {
	const [value, setValue] = useState([25, 80]);
	return (
		<div style={CAPABILITY_PREVIEW_STYLE}>
			<Slider
				aria-labels={["Minimum score", "Maximum score"]}
				onValueChange={setValue}
				value={value}
				valueFormatter={(next) => `${next}%`}
			/>
		</div>
	);
}

function SliderPage(): ReactElement {
	return (
		<CapabilityDocs
			apiRows={[
				{
					prop: "value / defaultValue",
					type: "readonly number[]",
					description: "One or two numeric thumb values.",
				},
				{
					prop: "onValueChange",
					type: "(value: number[]) => void",
					description: "Reports every keyboard or pointer change.",
				},
				{
					prop: "onValueCommit",
					type: "(value: number[]) => void",
					description: "Reports the final value at interaction end.",
				},
				{
					prop: "aria-labels",
					type: "[string] | [string, string]",
					description: "Required accessible label per thumb.",
				},
				{
					prop: "min / max / step",
					type: "number",
					defaultValue: "0 / 100 / 1",
					description: "Numeric range and increment.",
				},
				{
					prop: "minStepsBetweenThumbs",
					type: "number",
					description: "Minimum step distance between two thumbs.",
				},
				{
					prop: "disabled",
					type: "boolean",
					defaultValue: "false",
					description: "Disables every thumb.",
				},
				{
					prop: "orientation",
					type: "'horizontal' | 'vertical'",
					defaultValue: "'horizontal'",
					description: "Visual axis and keyboard semantics.",
				},
				{
					prop: "dir",
					type: "'ltr' | 'rtl'",
					description: "Direction used by horizontal keyboard movement.",
				},
				{
					prop: "inverted",
					type: "boolean",
					defaultValue: "false",
					description: "Inverts the direction of increasing values.",
				},
				{
					prop: "valueFormatter",
					type: "(value, index) => ReactNode",
					description:
						"Formats visible and assistive text without changing values.",
				},
				{
					prop: "showValue",
					type: "boolean",
					defaultValue: "true",
					description: "Shows the synchronized formatted value row.",
				},
				{
					prop: "className",
					type: "string",
					description: "Additional class name on the slider wrapper.",
				},
			]}
			category="Inputs"
			code={CODE}
			componentName="Slider"
			render={() => <SliderExample />}
			summary="Choose one bounded number or a two-thumb range with explicit accessible names."
			title="Slider"
		/>
	);
}

export default SliderPage;

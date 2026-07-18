import { Field, SelectNative } from "@lemn-ltd/ui";
import { type ReactElement, useState } from "react";
import { CAPABILITY_PREVIEW_STYLE, CapabilityDocs } from "./capability-docs.js";

const OPTIONS = [
	{ label: "Most recent", value: "recent" },
	{
		label: "Status",
		options: [
			{ label: "Active", value: "active" },
			{ label: "Paused", value: "paused" },
		],
	},
] as const;

const CODE = `import { Field, SelectNative } from '@lemn-ltd/ui';

<Field label="Sort reports">
  {(control) => (
    <SelectNative
      {...control}
      defaultValue="recent"
      options={options}
      placeholder="Choose a sort order"
    />
  )}
</Field>`;

function SelectNativeExample(): ReactElement {
	const [value, setValue] = useState("recent");
	return (
		<div style={CAPABILITY_PREVIEW_STYLE}>
			<Field hint={`Current value: ${value}`} label="Sort reports">
				{(control) => (
					<SelectNative
						{...control}
						onValueChange={setValue}
						options={OPTIONS}
						value={value}
					/>
				)}
			</Field>
		</div>
	);
}

function SelectNativePage(): ReactElement {
	return (
		<CapabilityDocs
			apiRows={[
				{
					prop: "options",
					type: "readonly SelectNativeItem[]",
					description: "Native options or labelled optgroups.",
				},
				{
					prop: "value / defaultValue",
					type: "string",
					description: "Controlled or initial native value.",
				},
				{
					prop: "placeholder",
					type: "string",
					description: "Disabled empty option shown before selection.",
				},
				{
					prop: "onChange",
					type: "ChangeEventHandler<HTMLSelectElement>",
					description: "Native change callback.",
				},
				{
					prop: "onValueChange",
					type: "(value: string) => void",
					description: "Convenience callback alongside native onChange.",
				},
				{
					prop: "invalid",
					type: "boolean",
					defaultValue: "false",
					description: "Adds invalid data and ARIA state.",
				},
				{
					prop: "ref",
					type: "Ref<HTMLSelectElement>",
					description: "Reference to the native select.",
				},
				{
					prop: "native select attributes",
					type: "SelectHTMLAttributes<HTMLSelectElement>",
					description:
						"Native value, name, form, required, disabled, and ARIA attributes except children.",
				},
			]}
			category="Inputs"
			code={CODE}
			componentName="SelectNative"
			render={() => <SelectNativeExample />}
			summary="Use the platform picker for simple forms, mobile UI, and progressive enhancement."
			title="Select native"
		/>
	);
}

export default SelectNativePage;

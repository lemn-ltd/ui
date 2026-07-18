import { DatePicker } from "@lemn-ltd/ui";
import type { ReactElement } from "react";
import { CAPABILITY_PREVIEW_STYLE, CapabilityDocs } from "./capability-docs.js";

const TODAY = new Date(2026, 6, 14);
const CODE = `import { DatePicker } from '@lemn-ltd/ui';

<DatePicker
  defaultValue={new Date(2026, 6, 18)}
  label="Due date"
  name="dueDate"
/>`;

function DatePickerPage(): ReactElement {
	return (
		<CapabilityDocs
			apiRows={[
				{
					prop: "label",
					type: "ReactNode",
					description: "Required Field label for the trigger.",
				},
				{
					prop: "value / defaultValue",
					type: "Date | null",
					description: "Controlled or initial local date.",
				},
				{
					prop: "onChange",
					type: "(value: Date) => void",
					description: "Reports a midnight-normalized date.",
				},
				{
					prop: "open / defaultOpen",
					type: "boolean",
					defaultValue: "false",
					description: "Controlled or initial popover state.",
				},
				{
					prop: "onOpenChange",
					type: "(open: boolean) => void",
					description: "Reports every popover state change.",
				},
				{
					prop: "placeholder",
					type: "string",
					defaultValue: "'Choose a date'",
					description: "Trigger copy before selection.",
				},
				{
					prop: "locale",
					type: "string",
					defaultValue: "'en-US'",
					description: "Intl locale for trigger and Calendar labels.",
				},
				{
					prop: "minDate / maxDate",
					type: "Date",
					description: "Inclusive selectable boundaries shared with Calendar.",
				},
				{
					prop: "shouldDisableDate",
					type: "(date: Date) => boolean",
					description: "Additional date-level availability policy.",
				},
				{
					prop: "today",
					type: "Date",
					description: "Deterministic current-day override.",
				},
				{
					prop: "weekStartsOn",
					type: "0 | 1",
					defaultValue: "locale",
					description: "Sunday or Monday week start override.",
				},
				{
					prop: "name",
					type: "string",
					description: "Optional hidden form input using YYYY-MM-DD.",
				},
				{
					prop: "form",
					type: "string",
					description: "Associates the hidden input with an external form.",
				},
				{
					prop: "required",
					type: "boolean",
					defaultValue: "false",
					description: "Marks the labelled Field as required.",
				},
				{
					prop: "disabled",
					type: "boolean",
					defaultValue: "false",
					description: "Disables trigger, Calendar selection, and form input.",
				},
				{
					prop: "state",
					type: "'default' | 'error' | 'disabled'",
					defaultValue: "'default'",
					description: "Field visual and semantic state.",
				},
				{ prop: "hint", type: "ReactNode", description: "Field help content." },
				{
					prop: "error",
					type: "ReactNode",
					description: "Field error content and relationship.",
				},
				{
					prop: "className",
					type: "string",
					description: "Additional class name on the Field wrapper.",
				},
			]}
			category="Inputs"
			code={CODE}
			componentName="DatePicker"
			render={() => (
				<div style={CAPABILITY_PREVIEW_STYLE}>
					<DatePicker
						defaultValue={new Date(2026, 6, 18)}
						hint="Select the report deadline."
						label="Due date"
						name="dueDate"
						today={TODAY}
					/>
				</div>
			)}
			summary="Select one date in a Field-labelled popover without duplicating Calendar behavior."
			title="Date picker"
		/>
	);
}

export default DatePickerPage;

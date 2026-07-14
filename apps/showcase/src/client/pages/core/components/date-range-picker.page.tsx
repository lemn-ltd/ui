import { DateRangePicker } from "@lemn-ltd/ui";
import type { ReactElement } from "react";
import { CAPABILITY_PREVIEW_STYLE, CapabilityDocs } from "./capability-docs.js";

const TODAY = new Date(2026, 6, 14);
const CODE = `import { DateRangePicker } from '@lemn-ltd/ui';

<DateRangePicker
  defaultValue={{ start: new Date(2026, 6, 10), end: null }}
  label="Reporting period"
  name="period"
  numberOfMonths={2}
/>`;

function DateRangePickerPage(): ReactElement {
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
					type: "DateRangeValue",
					description: "Controlled or initial partial/complete range.",
				},
				{
					prop: "onChange",
					type: "(value: DateRangeValue) => void",
					description: "Reports every partial and complete selection.",
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
					defaultValue: "'Choose a date range'",
					description: "Trigger copy before a start date exists.",
				},
				{
					prop: "locale",
					type: "string",
					defaultValue: "'en-US'",
					description: "Intl locale for trigger and Calendar labels.",
				},
				{
					prop: "numberOfMonths",
					type: "1 | 2",
					defaultValue: "2",
					description: "Responsive adjacent month count.",
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
					description: "Creates .start and .end hidden form values.",
				},
				{
					prop: "form",
					type: "string",
					description: "Associates both hidden inputs with an external form.",
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
					description: "Disables trigger, Calendar selection, and form inputs.",
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
			componentName="DateRangePicker"
			render={() => (
				<div style={CAPABILITY_PREVIEW_STYLE}>
					<DateRangePicker
						defaultValue={{ start: new Date(2026, 6, 10), end: null }}
						hint="A partial selection remains explicit until you choose an end date."
						label="Reporting period"
						name="period"
						numberOfMonths={2}
						today={TODAY}
					/>
				</div>
			)}
			summary="Select a partial or complete date range through the shared range-mode Calendar."
			title="Date range picker"
		/>
	);
}

export default DateRangePickerPage;

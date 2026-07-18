import {
	ComponentPage,
	ExampleBlock,
	PropsTable,
} from "@portal/catalog-kit";
import { Calendar } from "@lemn-ltd/ui";
import type { ReactElement } from "react";

// A fixed "today" keeps the rendered grid (and its visual snapshot) deterministic.
const TODAY = new Date(2026, 5, 24);
const SELECTED = new Date(2026, 5, 12);

function CalendarPage(): ReactElement {
	return (
		<ComponentPage
			status="beta"
			summary="A deterministic one- or two-month date grid with discriminated single and range selection, disabled boundaries, locale-aware labels, and complete keyboard navigation."
			title="Calendar"
		>
			<ExampleBlock
				code={`<Calendar defaultValue={new Date(2026, 5, 12)} />`}
				render={() => <Calendar defaultValue={SELECTED} today={TODAY} />}
			/>

			<ExampleBlock
				code={`// Out-of-range days render disabled and cannot be selected.
<Calendar defaultValue={new Date(2026, 5, 12)} disableFuture />`}
				render={() => (
					<Calendar defaultValue={SELECTED} disableFuture today={TODAY} />
				)}
			/>

			<ExampleBlock
				code={`<Calendar
  mode="range"
  numberOfMonths={2}
  defaultValue={{ start: new Date(2026, 5, 12), end: null }}
/>`}
				render={() => (
					<Calendar
						defaultValue={{ start: SELECTED, end: null }}
						mode="range"
						numberOfMonths={2}
						today={TODAY}
					/>
				)}
			/>

			<PropsTable
				rows={[
					{
						name: "mode",
						type: "'single' | 'range'",
						defaultValue: "'single'",
						description:
							"Discriminates Date and DateRangeValue state contracts.",
					},
					{
						name: "value",
						type: "Date | null | DateRangeValue",
						description:
							"Controlled single or partial/complete range value matching mode.",
					},
					{
						name: "defaultValue",
						type: "Date | null | DateRangeValue",
						description: "Uncontrolled initial selection.",
					},
					{
						name: "onChange",
						type: "(date: Date | DateRangeValue) => void",
						description:
							"Mode-specific callback with midnight-normalized values.",
					},
					{
						name: "numberOfMonths",
						type: "1 | 2",
						defaultValue: "1",
						description: "Renders one or two adjacent responsive month grids.",
					},
					{
						name: "month",
						type: "Date",
						description: "Controlled visible month (any day within it).",
					},
					{
						name: "defaultMonth",
						type: "Date",
						description:
							"Uncontrolled initial visible month. Falls back to the selection, then today.",
					},
					{
						name: "onMonthChange",
						type: "(month: Date) => void",
						description: "Fires with the first day of the newly visible month.",
					},
					{
						name: "minDate",
						type: "Date",
						description: "Earliest selectable day (inclusive).",
					},
					{
						name: "maxDate",
						type: "Date",
						description: "Latest selectable day (inclusive).",
					},
					{
						name: "disableFuture",
						type: "boolean",
						description: "Disable every day after today.",
					},
					{
						name: "disablePast",
						type: "boolean",
						description: "Disable every day before today.",
					},
					{
						name: "shouldDisableDate",
						type: "(date: Date) => boolean",
						description: "Per-day predicate; return true to disable that day.",
					},
					{
						name: "today",
						type: "Date",
						defaultValue: "new Date()",
						description:
							'Reference "today". Injectable so portals and tests stay deterministic.',
					},
					{
						name: "weekStartsOn",
						type: "0 | 1",
						defaultValue: "0",
						description: "First column of the week. 0 = Sunday, 1 = Monday.",
					},
					{
						name: "locale",
						type: "string",
						defaultValue: "'en-US'",
						description: "BCP-47 locale for the month and weekday labels.",
					},
					{
						name: "aria-label",
						type: "string",
						description: "Accessible name for the calendar grid.",
					},
					{
						name: "className",
						type: "string",
						description: "Additional class name on the calendar root.",
					},
				]}
			/>
		</ComponentPage>
	);
}

export default CalendarPage;

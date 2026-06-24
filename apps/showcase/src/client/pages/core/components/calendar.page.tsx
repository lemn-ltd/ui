import { ComponentPage, ExampleBlock, PropsTable } from '@appranks/showcase-kit';
import { Calendar } from '@appranks/ui';
import type { ReactElement } from 'react';

// A fixed "today" keeps the rendered grid (and its visual snapshot) deterministic.
const TODAY = new Date(2026, 5, 24);
const SELECTED = new Date(2026, 5, 12);
const RANGE_MIN = new Date(2026, 5, 8);
const RANGE_MAX = new Date(2026, 5, 20);

function CalendarPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A month-grid date picker. It owns selection, today, and disabled states, navigates by month or by a quick year list, and disables out-of-range days from min/max, disableFuture, disablePast, or a per-day predicate."
      title="Calendar"
    >
      <ExampleBlock
        code={`<Calendar defaultValue={new Date(2026, 5, 12)} />`}
        render={() => <Calendar defaultValue={SELECTED} today={TODAY} />}
      />

      <ExampleBlock
        code={`// Out-of-range days render disabled and cannot be selected.
<Calendar defaultValue={new Date(2026, 5, 12)} disableFuture />`}
        render={() => <Calendar defaultValue={SELECTED} disableFuture today={TODAY} />}
      />

      <ExampleBlock
        code={`<Calendar
  minDate={new Date(2026, 5, 8)}
  maxDate={new Date(2026, 5, 20)}
  defaultValue={new Date(2026, 5, 12)}
/>`}
        render={() => (
          <Calendar
            defaultValue={SELECTED}
            maxDate={RANGE_MAX}
            minDate={RANGE_MIN}
            today={TODAY}
          />
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'value',
            type: 'Date | null',
            description: 'Controlled selected date. Pass null for no selection.',
          },
          {
            name: 'defaultValue',
            type: 'Date | null',
            description: 'Uncontrolled initial selection.',
          },
          {
            name: 'onChange',
            type: '(date: Date) => void',
            description: 'Fires with the chosen day (floored to midnight) when a day is picked.',
          },
          {
            name: 'month',
            type: 'Date',
            description: 'Controlled visible month (any day within it).',
          },
          {
            name: 'defaultMonth',
            type: 'Date',
            description: 'Uncontrolled initial visible month. Falls back to the selection, then today.',
          },
          {
            name: 'onMonthChange',
            type: '(month: Date) => void',
            description: 'Fires with the first day of the newly visible month.',
          },
          {
            name: 'minDate',
            type: 'Date',
            description: 'Earliest selectable day (inclusive).',
          },
          {
            name: 'maxDate',
            type: 'Date',
            description: 'Latest selectable day (inclusive).',
          },
          {
            name: 'disableFuture',
            type: 'boolean',
            description: 'Disable every day after today.',
          },
          {
            name: 'disablePast',
            type: 'boolean',
            description: 'Disable every day before today.',
          },
          {
            name: 'shouldDisableDate',
            type: '(date: Date) => boolean',
            description: 'Per-day predicate; return true to disable that day.',
          },
          {
            name: 'today',
            type: 'Date',
            defaultValue: 'new Date()',
            description: 'Reference "today". Injectable so showcases and tests stay deterministic.',
          },
          {
            name: 'weekStartsOn',
            type: '0 | 1',
            defaultValue: '0',
            description: 'First column of the week. 0 = Sunday, 1 = Monday.',
          },
          {
            name: 'locale',
            type: 'string',
            defaultValue: "'en-US'",
            description: 'BCP-47 locale for the month and weekday labels.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default CalendarPage;

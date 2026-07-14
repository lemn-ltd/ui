import { DateRangePicker } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { CapabilityDocs, CAPABILITY_PREVIEW_STYLE } from './capability-docs.js';

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
        { prop: 'label', type: 'ReactNode', description: 'Required Field label for the trigger.' },
        { prop: 'value / defaultValue', type: 'DateRangeValue', description: 'Controlled or initial partial/complete range.' },
        { prop: 'onChange', type: '(value: DateRangeValue) => void', description: 'Reports every partial and complete selection.' },
        { prop: 'numberOfMonths', type: '1 | 2', defaultValue: '2', description: 'Responsive adjacent month count.' },
        { prop: 'name', type: 'string', description: 'Creates .start and .end hidden form values.' },
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

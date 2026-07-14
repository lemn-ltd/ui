import { DatePicker } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { CapabilityDocs, CAPABILITY_PREVIEW_STYLE } from './capability-docs.js';

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
        { prop: 'label', type: 'ReactNode', description: 'Required Field label for the trigger.' },
        { prop: 'value / defaultValue', type: 'Date | null', description: 'Controlled or initial local date.' },
        { prop: 'onChange', type: '(value: Date) => void', description: 'Reports a midnight-normalized date.' },
        { prop: 'minDate / maxDate', type: 'Date', description: 'Inclusive selectable boundaries shared with Calendar.' },
        { prop: 'name', type: 'string', description: 'Optional hidden form input using YYYY-MM-DD.' },
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

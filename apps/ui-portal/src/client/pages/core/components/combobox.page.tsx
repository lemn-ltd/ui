import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@portal/catalog-kit';
import { Combobox, type ComboboxOption } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';
import { timezones } from '../../../fixtures';

const options: readonly ComboboxOption[] = timezones;

// A fixed width keeps the trigger and popover aligned inside preview cells.
const wrap = { width: '22rem' } as const;

function SingleCombobox(): ReactElement {
  const [value, setValue] = useState('Europe/London');
  return (
    <div style={wrap}>
      <Combobox
        onValueChange={setValue}
        options={options}
        placeholder="Select a timezone…"
        value={value}
      />
    </div>
  );
}

function MultiCombobox(): ReactElement {
  const [value, setValue] = useState<readonly string[]>(['America/New_York', 'Asia/Tokyo']);
  return (
    <div style={wrap}>
      <Combobox
        mode="multi"
        onValueChange={setValue}
        options={options}
        placeholder="Select timezones…"
        value={value}
      />
    </div>
  );
}

function ComboboxPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="Searchable select built on the canonical Popover and a cmdk filter. Single mode closes on select and shows the chosen label; multi mode toggles values as chips and keeps the popover open."
      title="Combobox"
    >
      <ExampleBlock
        code={`const [value, setValue] = useState('Europe/London');

<Combobox
  options={timezones}
  placeholder="Select a timezone…"
  value={value}
  onValueChange={setValue}
/>`}
        render={() => <SingleCombobox />}
      />

      <ExampleBlock
        code={`const [value, setValue] = useState(['America/New_York', 'Asia/Tokyo']);

<Combobox
  mode="multi"
  options={timezones}
  placeholder="Select timezones…"
  value={value}
  onValueChange={setValue}
/>`}
        render={() => <MultiCombobox />}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'single · empty',
            render: () => (
              <div style={wrap}>
                <Combobox options={options} placeholder="Select a timezone…" />
              </div>
            ),
          },
          {
            label: 'invalid',
            render: () => (
              <div style={wrap}>
                <Combobox invalid options={options} placeholder="Select a timezone…" />
              </div>
            ),
          },
          {
            label: 'disabled',
            render: () => (
              <div style={wrap}>
                <Combobox disabled options={options} placeholder="Select a timezone…" />
              </div>
            ),
          },
          {
            // Type a query with no match (for example "zzz") to surface the empty message.
            label: 'no matches (type "zzz")',
            render: () => (
              <div style={wrap}>
                <Combobox
                  emptyMessage="No matches"
                  options={options}
                  placeholder="Search for a timezone…"
                />
              </div>
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'options',
            type: 'readonly ComboboxOption[]',
            description:
              'Selectable options. Each has value, label, optional keywords, and optional disabled.',
          },
          {
            name: 'mode',
            type: "'single' | 'multi'",
            defaultValue: "'single'",
            description:
              'Single shows one chosen label and closes on select; multi shows chips and stays open.',
          },
          {
            name: 'value',
            type: 'string (single) | readonly string[] (multi)',
            description:
              'Controlled selection. A single value, or an array of values in multi mode.',
          },
          {
            name: 'onValueChange',
            type: '(value: string) => void (single) | (value: string[]) => void (multi)',
            description:
              'Fires on toggle. Receives a single value, or the next array in multi mode.',
          },
          {
            name: 'placeholder',
            type: 'string',
            defaultValue: "'Select an option…'",
            description: 'Trigger text shown when nothing is selected.',
          },
          {
            name: 'searchPlaceholder',
            type: 'string',
            defaultValue: "'Search…'",
            description: 'Placeholder for the in-popover search input.',
          },
          {
            name: 'emptyMessage',
            type: 'string',
            defaultValue: "'No matches'",
            description: 'Shown in the list when the query matches no option.',
          },
          {
            name: 'disabled',
            type: 'boolean',
            description: 'Disables the trigger.',
          },
          {
            name: 'invalid',
            type: 'boolean',
            description: 'Marks the trigger invalid (aria-invalid and data-invalid).',
          },
          {
            name: 'id / aria-invalid / aria-describedby / className',
            type: 'string | boolean',
            description: 'Identity, validity, and styling hooks — spread from Field when wrapped.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default ComboboxPage;

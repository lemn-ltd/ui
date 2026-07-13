import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { InputSelect } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';
import { selectOptions } from '../../../fixtures';

function SelectPage(): ReactElement {
  const [value, setValue] = useState(selectOptions[0]?.value ?? '');

  return (
    <ComponentPage
      status="stable"
      summary="A select whose popup is owned by the design system — a Radix Select projected onto the token surface, so the open menu matches the catalog instead of the browser's native control palette."
      title="Select"
    >
      <ExampleBlock
        code={`const [value, setValue] = useState('option-01');

<InputSelect
  aria-label="Sort order"
  onValueChange={setValue}
  options={selectOptions}
  value={value}
/>`}
        render={() => (
          <InputSelect
            aria-label="Sort order"
            onValueChange={setValue}
            options={selectOptions}
            value={value}
          />
        )}
      />

      <VariantsGallery
        columns={2}
        items={[
          {
            label: 'default',
            render: () => (
              <InputSelect
                aria-label="Sort order"
                defaultValue="option-01"
                options={selectOptions}
              />
            ),
          },
          {
            label: 'disabled',
            render: () => (
              <InputSelect
                aria-label="Sort order"
                defaultValue="option-01"
                disabled
                options={selectOptions}
              />
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'options',
            type: 'ReadonlyArray<{ value: string; label: string; disabled?: boolean }>',
            description: 'The selectable options rendered in the design-system popup.',
          },
          {
            name: 'value / defaultValue',
            type: 'string',
            description: 'Controlled or uncontrolled selected value.',
          },
          {
            name: 'onValueChange',
            type: '(value: string) => void',
            description: 'Called with the new value when the selection changes.',
          },
          {
            name: 'placeholder',
            type: 'string',
            description: 'Shown in the trigger while nothing is selected.',
          },
          {
            name: 'disabled / invalid',
            type: 'boolean',
            description: 'Disables the trigger, or marks it invalid via data-invalid.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default SelectPage;

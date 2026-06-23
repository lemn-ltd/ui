import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { RadioGroup, RadioGroupItem } from '@appranks/ui';
import { type ReactElement, useState } from 'react';

const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

function RadioPage(): ReactElement {
  const [value, setValue] = useState('light');

  return (
    <ComponentPage
      status="stable"
      summary="A Radix radio group. RadioGroup owns the selected value; each RadioGroupItem is a single-choice option."
      title="Radio"
    >
      <ExampleBlock
        code={`const [value, setValue] = useState('light');

<RadioGroup onValueChange={setValue} value={value}>
  {OPTIONS.map((option) => (
    <label htmlFor={\`radio-\${option.value}\`} key={option.value} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <RadioGroupItem id={\`radio-\${option.value}\`} value={option.value} />
      {option.label}
    </label>
  ))}
</RadioGroup>`}
        render={() => (
          <RadioGroup onValueChange={setValue} value={value}>
            {OPTIONS.map((option) => (
              <label
                htmlFor={`radio-${option.value}`}
                key={option.value}
                style={{ alignItems: 'center', display: 'flex', gap: 8 }}
              >
                <RadioGroupItem id={`radio-${option.value}`} value={option.value} />
                {option.label}
              </label>
            ))}
          </RadioGroup>
        )}
      />

      <VariantsGallery
        items={[
          {
            label: 'unselected',
            render: () => (
              <RadioGroup aria-label="Unselected">
                <RadioGroupItem aria-label="Option" value="a" />
              </RadioGroup>
            ),
          },
          {
            label: 'selected',
            render: () => (
              <RadioGroup aria-label="Selected" value="a">
                <RadioGroupItem aria-label="Option" value="a" />
              </RadioGroup>
            ),
          },
          {
            label: 'disabled · unselected',
            render: () => (
              <RadioGroup aria-label="Disabled unselected">
                <RadioGroupItem aria-label="Option" disabled value="a" />
              </RadioGroup>
            ),
          },
          {
            label: 'disabled · selected',
            render: () => (
              <RadioGroup aria-label="Disabled selected" value="a">
                <RadioGroupItem aria-label="Option" disabled value="a" />
              </RadioGroup>
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'RadioGroup value',
            type: 'string',
            description: 'Controlled selected value of the group.',
          },
          {
            name: 'RadioGroup onValueChange',
            type: '(value: string) => void',
            description: 'Called when the selected item changes.',
          },
          {
            name: 'RadioGroupItem value',
            type: 'string',
            description: 'Required unique value identifying the item within the group.',
          },
          {
            name: '…rest',
            type: 'Radix RadioGroup.Root / .Item props',
            description: 'Native and Radix props (disabled, name, required, orientation, …).',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default RadioPage;

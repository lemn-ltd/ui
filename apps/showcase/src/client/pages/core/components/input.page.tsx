import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { Input } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';

function InputPage(): ReactElement {
  const [value, setValue] = useState('');

  return (
    <ComponentPage
      status="stable"
      summary="A single-line text field over the native input. The invalid prop drives aria-invalid and data-invalid for error styling."
      title="Input"
    >
      <ExampleBlock
        code={`const [value, setValue] = useState('');

<Input
  aria-label="Project name"
  onChange={(event) => setValue(event.target.value)}
  placeholder="Project name"
  value={value}
/>`}
        render={() => (
          <Input
            aria-label="Project name"
            onChange={(event) => setValue(event.target.value)}
            placeholder="Project name"
            style={{ width: 240 }}
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
              <Input aria-label="Default input" placeholder="Placeholder" style={{ width: 200 }} />
            ),
          },
          {
            label: 'with value',
            render: () => (
              <Input aria-label="Filled input" defaultValue="Filled value" style={{ width: 200 }} />
            ),
          },
          {
            label: 'invalid',
            render: () => (
              <Input
                aria-label="Invalid input"
                defaultValue="Bad value"
                invalid
                placeholder="Placeholder"
                style={{ width: 200 }}
              />
            ),
          },
          {
            label: 'disabled',
            render: () => (
              <Input
                aria-label="Disabled input"
                disabled
                placeholder="Disabled"
                style={{ width: 200 }}
              />
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'invalid',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Marks the field invalid; sets aria-invalid and data-invalid.',
          },
          {
            name: '…rest',
            type: 'InputHTMLAttributes<HTMLInputElement>',
            description: 'Native input props (value, onChange, placeholder, disabled, type, …).',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default InputPage;

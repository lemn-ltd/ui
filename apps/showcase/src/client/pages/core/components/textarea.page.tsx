import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@lemn-ltd/showcase-kit';
import { Textarea } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';

function TextareaPage(): ReactElement {
  const [value, setValue] = useState('');

  return (
    <ComponentPage
      status="stable"
      summary="A multi-line text field over the native textarea. Rows default to 3; the invalid prop drives aria-invalid and data-invalid."
      title="Textarea"
    >
      <ExampleBlock
        code={`const [value, setValue] = useState('');

<Textarea
  aria-label="Description"
  onChange={(event) => setValue(event.target.value)}
  placeholder="Add a description"
  value={value}
/>`}
        render={() => (
          <Textarea
            aria-label="Description"
            onChange={(event) => setValue(event.target.value)}
            placeholder="Add a description"
            style={{ width: 280 }}
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
              <Textarea
                aria-label="Default textarea"
                placeholder="Placeholder"
                style={{ width: 240 }}
              />
            ),
          },
          {
            label: 'with value',
            render: () => (
              <Textarea
                aria-label="Filled textarea"
                defaultValue="A few lines of filled content."
                style={{ width: 240 }}
              />
            ),
          },
          {
            label: 'invalid',
            render: () => (
              <Textarea
                aria-label="Invalid textarea"
                defaultValue="Bad value"
                invalid
                placeholder="Placeholder"
                style={{ width: 240 }}
              />
            ),
          },
          {
            label: 'disabled',
            render: () => (
              <Textarea
                aria-label="Disabled textarea"
                disabled
                placeholder="Disabled"
                style={{ width: 240 }}
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
            name: 'rows',
            type: 'number',
            defaultValue: '3',
            description: 'Initial visible text rows, forwarded to the native textarea.',
          },
          {
            name: '…rest',
            type: 'TextareaHTMLAttributes<HTMLTextAreaElement>',
            description: 'Native textarea props (value, onChange, placeholder, disabled, …).',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default TextareaPage;

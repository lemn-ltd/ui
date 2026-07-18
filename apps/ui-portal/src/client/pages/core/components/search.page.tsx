import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@portal/catalog-kit';
import { InputSearch } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';

function SearchPage(): ReactElement {
  const [value, setValue] = useState('');

  return (
    <ComponentPage
      status="stable"
      summary="An expand-on-focus search field. The trigger reveals the input; Escape or the clear button collapses it back to the icon."
      title="Search"
    >
      <ExampleBlock
        code={`const [value, setValue] = useState('');

<InputSearch
  aria-label="Search projects"
  onChange={setValue}
  placeholder="Search projects"
  value={value}
/>`}
        render={() => (
          <InputSearch
            aria-label="Search projects"
            onChange={setValue}
            placeholder="Search projects"
            value={value}
          />
        )}
      />

      <VariantsGallery
        columns={2}
        items={[
          {
            label: 'collapsed',
            render: () => <CollapsedSearch />,
          },
          {
            label: 'expanded (with value)',
            render: () => <PrefilledSearch />,
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'value',
            type: 'string',
            description: 'Current query string (controlled).',
          },
          {
            name: 'onChange',
            type: '(next: string) => void',
            description: 'Called with the next query string; also called with "" on clear.',
          },
          {
            name: 'aria-label',
            type: 'string',
            description: 'Required accessible name shared by the trigger and the input.',
          },
          {
            name: 'placeholder',
            type: 'string',
            description: 'Placeholder shown in the expanded input.',
          },
          {
            name: 'className',
            type: 'string',
            description: 'Extra class names merged onto the wrapper.',
          },
        ]}
      />
    </ComponentPage>
  );
}

function CollapsedSearch(): ReactElement {
  const [value, setValue] = useState('');
  return <InputSearch aria-label="Search" onChange={setValue} placeholder="Search" value={value} />;
}

function PrefilledSearch(): ReactElement {
  const [value, setValue] = useState('design system');
  return <InputSearch aria-label="Search" onChange={setValue} placeholder="Search" value={value} />;
}

export default SearchPage;

import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { Breadcrumb } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { longTrail, shortTrail } from '../../../fixtures';

function BreadcrumbPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A navigation trail. Items with an href render as links, items with onClick as buttons, and the last item as the current page. Slashes separate the segments."
      title="Breadcrumb"
    >
      <ExampleBlock
        code={`<Breadcrumb
  items={[
    { label: 'Home', href: '#' },
    { label: 'Overview' },
  ]}
/>`}
        render={() => <Breadcrumb items={shortTrail} />}
      />

      <VariantsGallery
        columns={1}
        items={[
          { label: '2 items', render: () => <Breadcrumb items={shortTrail} /> },
          { label: '6 items', render: () => <Breadcrumb items={longTrail} /> },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'items',
            type: 'readonly BreadcrumbItem[]',
            description:
              'Trail segments. Each has a label and an optional href or onClick; the last item is marked aria-current="page".',
          },
          {
            name: '…rest',
            type: "Omit<HTMLAttributes<HTMLElement>, 'children'>",
            description: 'Native nav attributes; className is merged with the base class.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default BreadcrumbPage;

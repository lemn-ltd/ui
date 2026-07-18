import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@portal/catalog-kit';
import { JsonViewer } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { jsonSample } from '../../../fixtures';

function JsonViewerPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A monospace JSON tree with per-node collapse and distinct tones for keys, strings, numbers, and punctuation. Click any node caret to fold its children."
      title="JSON viewer"
    >
      <ExampleBlock
        code={`<JsonViewer data={record} />`}
        render={() => <JsonViewer data={jsonSample} />}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'defaultExpanded={true}',
            render: () => <JsonViewer data={jsonSample} defaultExpanded />,
          },
          {
            label: 'defaultExpanded={false}',
            render: () => <JsonViewer data={jsonSample} defaultExpanded={false} />,
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'data',
            type: 'unknown',
            description: 'The value to render; objects and arrays become collapsible nodes.',
          },
          {
            name: 'defaultExpanded',
            type: 'boolean',
            defaultValue: 'true',
            description: 'Initial open state applied to every node.',
          },
          {
            name: 'className',
            type: 'string',
            description: 'Extra class names appended to the root.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default JsonViewerPage;

import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@portal/catalog-kit';
import { Icon, ScopePill } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

function ScopePillPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A read-only pill that labels the scope or context something applies to. It renders its children inside a styled span."
      title="Scope pill"
    >
      <ExampleBlock
        code={`<ScopePill>Workspace</ScopePill>
<ScopePill>
  <Icon name="lock" size={12} />
  Private
</ScopePill>`}
        render={() => (
          <>
            <ScopePill>Workspace</ScopePill>
            <ScopePill>
              <Icon name="lock" size={12} />
              Private
            </ScopePill>
          </>
        )}
      />

      <VariantsGallery
        items={[
          { label: 'text', render: () => <ScopePill>Workspace</ScopePill> },
          {
            label: 'with icon',
            render: () => (
              <ScopePill>
                <Icon name="lock" size={12} />
                Private
              </ScopePill>
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'children',
            type: 'ReactNode',
            description: 'The scope label, optionally with a leading icon.',
          },
          {
            name: '…rest',
            type: 'HTMLAttributes<HTMLSpanElement>',
            description: 'Native span props (className, title, …).',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default ScopePillPage;

import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { Kbd } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

function KbdPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A keyboard key hint over the native kbd element. Compose several to show a shortcut chord."
      title="Kbd"
    >
      <ExampleBlock
        code={`<span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
  <Kbd>⌘</Kbd>
  <Kbd>K</Kbd>
</span>`}
        render={() => (
          <span style={{ alignItems: 'center', display: 'inline-flex', gap: 4 }}>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        )}
      />

      <VariantsGallery
        items={[
          { label: 'single key', render: () => <Kbd>Esc</Kbd> },
          { label: 'modifier', render: () => <Kbd>⇧</Kbd> },
          {
            label: 'chord',
            render: () => (
              <span style={{ alignItems: 'center', display: 'inline-flex', gap: 4 }}>
                <Kbd>⌘</Kbd>
                <Kbd>⇧</Kbd>
                <Kbd>P</Kbd>
              </span>
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'children',
            type: 'ReactNode',
            description: 'The key label, normally a single character or short token.',
          },
          {
            name: '…rest',
            type: 'HTMLAttributes<HTMLElement>',
            description: 'Native element props (className, title, …).',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default KbdPage;

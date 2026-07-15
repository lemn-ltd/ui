import { ComponentPage, ExampleBlock, PropsTable } from '@lemn-ltd/showcase-kit';
import { Badge, Button, EntityToolbar } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

function EntityToolbarPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A per-entity header band with identity and actions slots. It collapses to nothing when every slot is empty, so an entity with no chrome leaves no residual band."
      title="Entity toolbar"
    >
      <ExampleBlock
        code={`<EntityToolbar
  identity={<Badge tone="info">Active</Badge>}
  actions={<Button variant="secondary">Edit</Button>}
/>`}
        render={() => (
          <div style={{ width: '100%' }}>
            <EntityToolbar
              actions={<Button variant="secondary">Edit</Button>}
              identity={<Badge tone="info">Active</Badge>}
            />
          </div>
        )}
      />

      <ExampleBlock
        code={`// All slots empty: the toolbar renders nothing.
<EntityToolbar />`}
        render={() => (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--lemn-space-2)',
              color: 'var(--lemn-color-text-muted)',
              fontSize: 'var(--lemn-font-size-small)',
            }}
          >
            <EntityToolbar />
            <span>Nothing renders when every slot is empty.</span>
          </div>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'identity',
            type: 'ReactNode',
            description: 'Leading slot for entity identity, e.g. a status badge.',
          },
          {
            name: 'actions',
            type: 'ReactNode',
            description: 'Trailing slot for entity-scoped actions.',
          },
          {
            name: '(return)',
            type: 'ReactElement | null',
            description: 'Returns null when identity and actions are both empty.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default EntityToolbarPage;

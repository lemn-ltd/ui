import { ComponentPage, ExampleBlock, PropsTable } from '@lemn-ltd/showcase-kit';
import { Card, ListShell } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

function ListShellPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="The outer content section that gives every list or grid the same padding and vertical rhythm. It is a thin layout wrapper around its children."
      title="List shell"
    >
      <ExampleBlock
        code={`<ListShell>
  <Card title="Saved views">Reusable filters and column layouts.</Card>
  <Card title="Members">People with access to this workspace.</Card>
</ListShell>`}
        render={() => (
          <ListShell>
            <Card title="Saved views">Reusable filters and column layouts.</Card>
            <Card title="Members">People with access to this workspace.</Card>
          </ListShell>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'children',
            type: 'ReactNode',
            description: 'The list, grid, or section content to wrap.',
          },
          {
            name: '…rest',
            type: 'HTMLAttributes<HTMLDivElement>',
            description: 'Native div props spread onto the root.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default ListShellPage;

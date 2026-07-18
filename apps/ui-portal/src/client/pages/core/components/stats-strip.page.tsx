import { ComponentPage, ExampleBlock, PropsTable } from '@portal/catalog-kit';
import { StatsStrip } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { stats } from '../../../fixtures';

function StatsStripPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="An edge-to-edge horizontal row of stat cards separated by thin border dividers. It reflows responsively as the row narrows."
      title="Stats strip"
    >
      <ExampleBlock
        code={`<StatsStrip
  stats={[
    { label: 'Total items', value: '1,284', delta: { direction: 'up', label: '+8.2%' } },
    { label: 'Active', value: '342', delta: { direction: 'up', label: '+3.1%' } },
    { label: 'Pending', value: '57', delta: { direction: 'down', label: '-12.4%' } },
    { label: 'Archived', value: '903', delta: { direction: 'flat', label: '0.0%' } },
  ]}
/>`}
        render={() => <StatsStrip stats={stats} />}
      />

      <PropsTable
        rows={[
          {
            name: 'stats',
            type: 'readonly StatCardProps[]',
            description: 'Ordered metric tiles; each renders as a StatCard cell.',
          },
          {
            name: '…rest',
            type: "Omit<HTMLAttributes<HTMLDivElement>, 'children'>",
            description: 'Native div props spread onto the root.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default StatsStripPage;

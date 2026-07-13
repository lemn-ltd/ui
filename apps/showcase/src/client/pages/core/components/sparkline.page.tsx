import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { Sparkline } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { sparklinePoints } from '../../../fixtures';

function SparklinePage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A compact inline bar chart: thin accent bars scaled to the series maximum, with a baseline tick floor so a zero value still reads."
      title="Sparkline"
    >
      <ExampleBlock
        code={`<Sparkline points={hourlyPoints} />`}
        render={() => <Sparkline points={sparklinePoints} />}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'rising',
            render: () => <Sparkline points={[4, 9, 16, 25, 36, 49, 64, 81, 100]} />,
          },
          {
            label: 'volatile',
            render: () => <Sparkline points={[40, 8, 70, 20, 95, 12, 60, 4, 88]} />,
          },
          {
            label: 'flat',
            render: () => <Sparkline points={[50, 50, 50, 50, 50, 50, 50, 50, 50]} />,
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'points',
            type: 'readonly number[]',
            description: 'The numeric series; each value becomes one bar scaled to the maximum.',
          },
          {
            name: '…rest',
            type: "Omit<HTMLAttributes<HTMLDivElement>, 'children'>",
            description: 'Native div props spread onto the root (role defaults to "img").',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default SparklinePage;

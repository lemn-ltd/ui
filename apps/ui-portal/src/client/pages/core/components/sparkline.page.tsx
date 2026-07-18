import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@portal/catalog-kit';
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
        code={`<Sparkline aria-label="Hourly activity trend" points={hourlyPoints} />`}
        render={() => <Sparkline aria-label="Hourly activity trend" points={sparklinePoints} />}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'rising',
            render: () => (
              <Sparkline
                aria-label="Rising trend"
                points={[4, 9, 16, 25, 36, 49, 64, 81, 100]}
              />
            ),
          },
          {
            label: 'volatile',
            render: () => (
              <Sparkline
                aria-label="Volatile trend"
                points={[40, 8, 70, 20, 95, 12, 60, 4, 88]}
              />
            ),
          },
          {
            label: 'flat',
            render: () => (
              <Sparkline
                aria-label="Flat trend"
                points={[50, 50, 50, 50, 50, 50, 50, 50, 50]}
              />
            ),
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
            name: 'decorative',
            type: 'boolean',
            defaultValue: 'false',
            description:
              'Removes image semantics and sets aria-hidden. Informative sparklines require aria-label or aria-labelledby.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default SparklinePage;

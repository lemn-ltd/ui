import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { StatCard, type StatDeltaDirection } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { stats } from '../../../fixtures';

const DELTA_LABEL: Record<StatDeltaDirection, string> = {
  up: '+8.2%',
  down: '-12.4%',
  flat: '0.0%',
};

const DIRECTIONS: readonly StatDeltaDirection[] = ['up', 'down', 'flat'];

function StatCardPage(): ReactElement {
  const sample = stats[0];

  return (
    <ComponentPage
      status="stable"
      summary="A single metric tile: a muted label, a display-sized value, and an optional signed delta whose direction writes data-direction."
      title="Stat card"
    >
      <ExampleBlock
        code={`<StatCard
  label="Total items"
  value="1,284"
  delta={{ direction: 'up', label: '+8.2%' }}
/>`}
        render={() => (
          <StatCard delta={sample?.delta} label={sample?.label} value={sample?.value} />
        )}
      />

      <VariantsGallery
        items={DIRECTIONS.map((direction) => ({
          label: `delta · ${direction}`,
          render: () => (
            <StatCard
              delta={{ direction, label: DELTA_LABEL[direction] }}
              label="Active"
              value="342"
            />
          ),
        }))}
      />

      <VariantsGallery
        items={[
          {
            label: 'no delta',
            render: () => <StatCard label="Pending" value="57" />,
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'label',
            type: 'ReactNode',
            description: 'Muted caption above the value.',
          },
          {
            name: 'value',
            type: 'ReactNode',
            description: 'Display-sized primary metric.',
          },
          {
            name: 'delta',
            type: "{ direction: 'up' | 'down' | 'flat'; label: ReactNode }",
            description: 'Optional signed change; direction is written to data-direction.',
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

export default StatCardPage;

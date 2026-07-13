import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { RelativeTime } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { relativeNow, relativeSamples } from '../../../fixtures';

function RelativeTimePage(): ReactElement {
  const sample = relativeSamples[2];

  return (
    <ComponentPage
      status="stable"
      summary="Renders an absolute timestamp as a muted relative label such as 2h ago. The now prop anchors the comparison so the output stays deterministic."
      title="Relative time"
    >
      <ExampleBlock
        code={`<RelativeTime value="2026-06-01T08:45:00.000Z" now={now} />`}
        render={() => <RelativeTime now={relativeNow} value={sample?.value ?? ''} />}
      />

      <VariantsGallery
        items={relativeSamples.map((item) => ({
          label: item.id,
          render: () => <RelativeTime now={relativeNow} value={item.value} />,
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'value',
            type: 'string | number | Date',
            description: 'The absolute timestamp to format relative to now.',
          },
          {
            name: 'now',
            type: 'number',
            defaultValue: 'Date.now()',
            description:
              'Epoch millis used as the comparison anchor; pass a fixed clock for stable output.',
          },
          {
            name: '…rest',
            type: "Omit<HTMLAttributes<HTMLTimeElement>, 'children'>",
            description: 'Native time props spread onto the root (dateTime is set automatically).',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default RelativeTimePage;

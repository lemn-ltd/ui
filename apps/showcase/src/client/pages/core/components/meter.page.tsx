import { ComponentPage, ExampleBlock, PropsTable } from '@lemn-ltd/showcase-kit';
import { Meter } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

function MeterPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A linear ratio bar for a single value against a max — quota used, budget spent, progress. The fill is the clamped value/max; tone signals headroom (accent → warn → danger)."
      title="Meter"
    >
      <ExampleBlock
        code={`<Meter label="Quota" value={70} max={100} />
<Meter label="Budget" value={92} max={100} tone="warn" />
<Meter label="Calls this window" value={100} max={100} tone="danger" />`}
        render={() => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, inlineSize: 280 }}>
            <Meter label="Quota" max={100} value={70} />
            <Meter label="Budget" max={100} tone="warn" value={92} />
            <Meter label="Calls this window" max={100} tone="danger" value={100} />
            <Meter label="Coverage" max={100} showValue={false} tone="success" value={48} />
          </div>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'value',
            type: 'number',
            description: 'Current value; clamped to [0, max] for the fill.',
          },
          {
            name: 'max',
            type: 'number',
            description: 'Upper bound. Values <= 0 are treated as 1.',
          },
          {
            name: 'label',
            type: 'string',
            description: 'Optional leading label shown above the track.',
          },
          {
            name: 'tone',
            type: "'accent' | 'success' | 'warn' | 'danger'",
            defaultValue: "'accent'",
            description: 'Fill color signalling headroom.',
          },
          {
            name: 'showValue',
            type: 'boolean',
            defaultValue: 'true',
            description: 'Show the value / max readout.',
          },
          {
            name: 'formatValue',
            type: '(value, max) => string',
            description: 'Override the readout text (e.g. format budget micros to USD).',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default MeterPage;

import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { RetryChip, type RetryState, WaitChip, type WaitState } from '@appranks/ui';
import type { ReactElement } from 'react';

const WAIT_STATES: readonly WaitState[] = ['pending', 'active', 'completed', 'cancelled'];
const RETRY_STATES: readonly RetryState[] = [
  'scheduled',
  'retrying',
  'failed',
  'exhausted',
  'succeeded',
];

function WaitRetryChipPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="Compact pills for a node's wait timer (WaitChip) and retry budget (RetryChip), toned by state. Both reuse Badge so they read like every other status pill in a graph, scheduler, or evidence row."
      title="Wait & retry chips"
    >
      <ExampleBlock
        code={`<WaitChip label="in 28s" state="pending" />
<WaitChip label="30s" state="completed" />
<RetryChip attempt={2} maxAttempts={5} state="scheduled" label="in 1m" />
<RetryChip attempt={3} maxAttempts={3} state="exhausted" label="30s ago" />`}
        render={() => (
          <>
            <WaitChip label="in 28s" state="pending" />
            <WaitChip label="30s" state="completed" />
            <RetryChip attempt={2} label="in 1m" maxAttempts={5} state="scheduled" />
            <RetryChip attempt={3} label="30s ago" maxAttempts={3} state="exhausted" />
          </>
        )}
      />

      <VariantsGallery
        items={[
          ...WAIT_STATES.map((state) => ({
            label: `wait · ${state}`,
            render: () => <WaitChip label="30s" state={state} />,
          })),
          ...RETRY_STATES.map((state) => ({
            label: `retry · ${state}`,
            render: () => <RetryChip attempt={2} maxAttempts={5} state={state} />,
          })),
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'WaitChip.label',
            type: 'string',
            description: 'The wait duration or countdown, e.g. "30s" or "in 28s".',
          },
          {
            name: 'WaitChip.state',
            type: "'pending' | 'active' | 'completed' | 'cancelled'",
            defaultValue: "'pending'",
            description: 'Wait lifecycle, mapped to a badge tone.',
          },
          {
            name: 'RetryChip.attempt / maxAttempts',
            type: 'number',
            description: 'Rendered as the "attempt / maxAttempts" count.',
          },
          {
            name: 'RetryChip.state',
            type: "'scheduled' | 'retrying' | 'failed' | 'exhausted' | 'succeeded'",
            defaultValue: "'scheduled'",
            description: 'Retry lifecycle, mapped to a badge tone.',
          },
          {
            name: 'RetryChip.label',
            type: 'string',
            description: 'Optional trailing timing detail, e.g. "in 1m" or "30s ago".',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default WaitRetryChipPage;

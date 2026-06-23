import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { type NodeAttempt, NodeAttemptsTable } from '@appranks/ui';
import type { ReactElement } from 'react';

const ATTEMPTS: readonly NodeAttempt[] = [
  { node: 'fetch', type: 'action', attempt: 1, state: 'completed', duration: '0.8s' },
  { node: 'classify', type: 'agent', attempt: 1, state: 'completed', duration: '1.2s' },
  {
    node: 'transform',
    type: 'action',
    attempt: 2,
    state: 'completed',
    duration: '1.1s',
    error: 'retried 1×',
  },
  {
    node: 'deploy',
    type: 'action',
    attempt: 3,
    state: 'failed',
    duration: '2.4s',
    error: 'timeout',
  },
  { node: 'approve', type: 'human_task', attempt: 1, state: 'waiting', error: 'awaiting approval' },
  { node: 'notify', type: 'action', attempt: 1, state: 'skipped', error: 'branch not taken' },
];

function NodeAttemptsTablePage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="The per-node attempt ledger for an automation run: node, type, attempt, execution state, duration, and error. Composes the canonical DataTable and renders each state through NodeStateChip; an empty ledger falls back to a first-run empty state."
      title="Node attempts table"
    >
      <ExampleBlock
        code={`<NodeAttemptsTable attempts={attempts} />`}
        render={() => (
          <div style={{ maxWidth: 900 }}>
            <NodeAttemptsTable attempts={ATTEMPTS} />
          </div>
        )}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'empty',
            render: () => (
              <div style={{ maxWidth: 900 }}>
                <NodeAttemptsTable attempts={[]} />
              </div>
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'attempts',
            type: 'NodeAttempt[]',
            description: 'Rows: node, type, attempt, state, optional duration, and error.',
          },
          {
            name: 'emptyHint',
            type: 'string',
            description: 'Empty-state description when there are no attempts.',
          },
          {
            name: 'className',
            type: 'string',
            description: 'Forwarded to the underlying DataTable wrapper.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default NodeAttemptsTablePage;

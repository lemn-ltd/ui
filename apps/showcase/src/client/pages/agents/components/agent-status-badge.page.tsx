import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { AgentStatusBadge, type AgentStatusBadgeStatus } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const STATUSES: readonly AgentStatusBadgeStatus[] = [
  'idle',
  'queued',
  'running',
  'waiting',
  'completed',
  'failed',
  'cancelled',
];

function AgentStatusBadgePage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A reusable, brand-neutral badge for agent lifecycle and execution state surfaces."
      title="Agent status badge"
    >
      <ExampleBlock
        code={`<AgentStatusBadge status="running" />
<AgentStatusBadge status="waiting" />
<AgentStatusBadge label="Streaming" status="running" variant="subtle" />`}
        render={() => (
          <>
            <AgentStatusBadge status="running" />
            <AgentStatusBadge status="waiting" />
            <AgentStatusBadge label="Streaming" status="running" variant="subtle" />
          </>
        )}
      />

      <VariantsGallery
        items={STATUSES.map((status) => ({
          label: status,
          render: () => <AgentStatusBadge status={status} />,
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'status',
            type: "'idle' | 'queued' | 'running' | 'waiting' | 'completed' | 'failed' | 'cancelled'",
            description: 'Agent state written to data-agent-status and mapped to a badge tone.',
          },
          {
            name: 'label',
            type: 'string',
            defaultValue: 'status label',
            description: 'Optional visible label when a surface needs product-specific wording.',
          },
          {
            name: 'variant',
            type: "'subtle' | 'soft'",
            defaultValue: "'soft'",
            description: 'Badge emphasis passed through to the underlying Badge.',
          },
          {
            name: '...rest',
            type: 'HTMLAttributes<HTMLSpanElement>',
            description: 'Native span props forwarded to the underlying badge.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default AgentStatusBadgePage;

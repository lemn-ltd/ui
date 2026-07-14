import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@lemn-ltd/showcase-kit';
import { type AutomationStatus, AutomationStatusBadge } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const STATUSES: readonly AutomationStatus[] = [
  'draft',
  'published',
  'archived',
  'queued',
  'scheduled',
  'due',
  'running',
  'waiting',
  'completed',
  'failed',
  'cancelled',
];

function AutomationStatusBadgePage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A brand-neutral status pill for automation definition lifecycle and run state. A thin wrapper over Badge that maps the automation vocabulary to a dotted tone."
      title="Automation status badge"
    >
      <ExampleBlock
        code={`<AutomationStatusBadge status="published" />
<AutomationStatusBadge status="running" />
<AutomationStatusBadge status="failed" />
<AutomationStatusBadge label="Live" status="running" variant="subtle" />`}
        render={() => (
          <>
            <AutomationStatusBadge status="published" />
            <AutomationStatusBadge status="running" />
            <AutomationStatusBadge status="failed" />
            <AutomationStatusBadge label="Live" status="running" variant="subtle" />
          </>
        )}
      />

      <VariantsGallery
        items={STATUSES.map((status) => ({
          label: status,
          render: () => <AutomationStatusBadge status={status} />,
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'status',
            type: STATUSES.map((status) => `'${status}'`).join(' | '),
            description:
              'Automation lifecycle or run state, written to data-automation-status and mapped to a badge tone.',
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

export default AutomationStatusBadgePage;

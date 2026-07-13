import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { ScheduleEditor } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

function ScheduleEditorPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A presentational schedule configuration block: a kind selector, the expression (editable or read-only), an optional timezone, and a live next/last-run summary with a status pill. Controlled by the host."
      title="Schedule editor"
    >
      <ExampleBlock
        code={`<ScheduleEditor
  kind="cron"
  expression="0 2 * * *"
  expressionHint="daily 02:00 UTC"
  timezone="UTC"
  status="scheduled"
  nextRunLabel="in 22h"
  lastRunLabel="2h ago"
/>`}
        render={() => (
          <div style={{ maxWidth: 480 }}>
            <ScheduleEditor
              expression="0 2 * * *"
              expressionHint="daily 02:00 UTC"
              kind="cron"
              lastRunLabel="2h ago"
              nextRunLabel="in 22h"
              status="scheduled"
              timezone="UTC"
            />
          </div>
        )}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'interval',
            render: () => (
              <ScheduleEditor
                expression="PT15M"
                expressionHint="every 15 minutes"
                kind="interval"
                nextRunLabel="in 4m"
                status="scheduled"
              />
            ),
          },
          {
            label: 'read-only · due',
            render: () => (
              <ScheduleEditor
                expression="0 2 * * *"
                expressionHint="daily 02:00 UTC"
                kind="cron"
                nextRunLabel="now"
                readOnly
                status="due"
              />
            ),
          },
          {
            label: 'disabled · paused',
            render: () => (
              <ScheduleEditor
                disabled
                expression="2026-07-01T09:00:00Z"
                kind="fixed"
                lastRunLabel="never"
                status="paused"
              />
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'kind',
            type: "'cron' | 'interval' | 'fixed'",
            description: 'Active schedule kind, selected via the segmented control.',
          },
          {
            name: 'expression',
            type: 'string',
            description: 'The schedule expression for the active kind.',
          },
          {
            name: 'expressionHint',
            type: 'string',
            description: 'A humanized gloss for the expression, e.g. "daily 02:00 UTC".',
          },
          { name: 'timezone', type: 'string', description: 'Optional timezone detail row.' },
          {
            name: 'status',
            type: "'scheduled' | 'due' | 'paused'",
            description: 'Optional state pill in the summary footer.',
          },
          {
            name: 'nextRunLabel / lastRunLabel',
            type: 'string',
            description: 'Preformatted run labels composed into the summary line.',
          },
          {
            name: 'readOnly',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Renders the expression as a monospace value instead of an input.',
          },
          {
            name: 'onKindChange / onExpressionChange',
            type: '(value) => void',
            description: 'Change callbacks; the host owns the controlled values.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default ScheduleEditorPage;

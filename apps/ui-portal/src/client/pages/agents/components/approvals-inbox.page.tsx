import { ComponentPage, ExampleBlock, PropsTable } from '@portal/catalog-kit';
import { type ApprovalRequest, ApprovalsInbox } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const NOW = '2026-06-20T12:00:00.000Z';

function minutesAgo(minutes: number): string {
  return new Date(new Date(NOW).getTime() - minutes * 60_000).toISOString();
}

const REQUESTS: readonly ApprovalRequest[] = [
  {
    hitlRequestId: 'hitl_confirm_1',
    kind: 'approval',
    mode: 'confirmation',
    prompt: 'Send the drafted summary email to the on-call alias?',
    capabilityRef: 'mcp.mail.send_message',
    integrationName: 'Mail',
    risk: 'high',
    requestedAt: minutesAgo(3),
  },
  {
    hitlRequestId: 'hitl_choice_1',
    kind: 'approval',
    mode: 'choice',
    prompt: 'Which environment should the deploy target?',
    choices: [
      { id: 'staging', label: 'Staging', description: 'Safe rehearsal environment' },
      { id: 'production', label: 'Production', description: 'Live production traffic' },
    ],
    capabilityRef: 'deploy.environment.select',
    risk: 'critical',
    requestedAt: minutesAgo(12),
  },
  {
    hitlRequestId: 'hitl_text_1',
    kind: 'input_request',
    mode: 'text',
    prompt: 'Provide the change reference to attach to this action.',
    integrationName: 'Tracker',
    risk: 'low',
    requestedAt: minutesAgo(1),
  },
];

const noop = (): void => undefined;

function ApprovalsInboxPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A vertical queue of pending HITL requests, each rendered as an ApprovalCard, with a count header. Falls back to an EmptyState when the inbox is clear."
      title="Approvals inbox"
    >
      <ExampleBlock
        code={`<ApprovalsInbox
  requests={requests}
  onApprove={onApprove}
  onReject={onReject}
  onChoose={onChoose}
/>`}
        render={() => (
          <ApprovalsInbox onApprove={noop} onChoose={noop} onReject={noop} requests={REQUESTS} />
        )}
      />

      <ExampleBlock
        code={`<ApprovalsInbox
  requests={[]}
  emptyHint="No pending approvals"
  onApprove={onApprove}
  onReject={onReject}
/>`}
        render={() => (
          <ApprovalsInbox
            emptyHint="No pending approvals"
            onApprove={noop}
            onReject={noop}
            requests={[]}
          />
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'requests',
            type: 'readonly ApprovalRequest[]',
            description:
              'The pending HITL requests to queue. An empty list renders the empty state.',
          },
          {
            name: 'onApprove',
            type: '(hitlRequestId: string) => void',
            description: 'Forwarded to each card; called when a confirmation request is approved.',
          },
          {
            name: 'onReject',
            type: '(hitlRequestId: string) => void',
            description: 'Forwarded to each card; called when a request is rejected.',
          },
          {
            name: 'onChoose',
            type: '(hitlRequestId: string, choiceId: string) => void',
            description: 'Forwarded to each card; called when a choice-mode option is selected.',
          },
          {
            name: 'emptyHint',
            type: 'string',
            defaultValue: "'No pending approvals'",
            description: 'Message shown in the empty state when there are no pending requests.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default ApprovalsInboxPage;

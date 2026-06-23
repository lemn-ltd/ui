import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { ApprovalCard, type ApprovalRequest } from '@appranks/ui';
import type { ReactElement } from 'react';

const NOW = '2026-06-20T12:00:00.000Z';

function minutesAgo(minutes: number): string {
  return new Date(new Date(NOW).getTime() - minutes * 60_000).toISOString();
}

const CONFIRMATION_REQUEST: ApprovalRequest = {
  hitlRequestId: 'hitl_confirm_1',
  kind: 'approval',
  mode: 'confirmation',
  prompt: 'Send the drafted summary email to the on-call alias?',
  capabilityRef: 'mcp.mail.send_message',
  integrationName: 'Mail',
  risk: 'high',
  requestedAt: minutesAgo(3),
};

const CHOICE_REQUEST: ApprovalRequest = {
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
};

const TEXT_REQUEST: ApprovalRequest = {
  hitlRequestId: 'hitl_text_1',
  kind: 'input_request',
  mode: 'text',
  prompt: 'Provide the change reference to attach to this action.',
  integrationName: 'Tracker',
  risk: 'low',
  requestedAt: minutesAgo(1),
};

const noop = (): void => undefined;

function ApprovalCardPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A single pending HITL request rendered as a decision surface. Composes Card, CapabilityChip (risk), Button, and RelativeTime. The body shape follows the request mode: confirmation, choice, or text input."
      title="Approval card"
    >
      <ExampleBlock
        code={`<ApprovalCard
  request={{
    hitlRequestId: 'hitl_confirm_1',
    kind: 'approval',
    mode: 'confirmation',
    prompt: 'Send the drafted summary email to the on-call alias?',
    capabilityRef: 'mcp.mail.send_message',
    integrationName: 'Mail',
    risk: 'high',
    requestedAt,
  }}
  onApprove={onApprove}
  onReject={onReject}
/>`}
        render={() => (
          <ApprovalCard onApprove={noop} onReject={noop} request={CONFIRMATION_REQUEST} />
        )}
      />

      <VariantsGallery
        items={[
          {
            label: 'mode: confirmation',
            render: () => (
              <ApprovalCard onApprove={noop} onReject={noop} request={CONFIRMATION_REQUEST} />
            ),
          },
          {
            label: 'mode: choice',
            render: () => (
              <ApprovalCard
                onApprove={noop}
                onChoose={noop}
                onReject={noop}
                request={CHOICE_REQUEST}
              />
            ),
          },
          {
            label: 'mode: text',
            render: () => <ApprovalCard onApprove={noop} onReject={noop} request={TEXT_REQUEST} />,
          },
          {
            label: 'busy: true',
            render: () => (
              <ApprovalCard busy onApprove={noop} onReject={noop} request={CONFIRMATION_REQUEST} />
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'request',
            type: 'ApprovalRequest',
            description:
              'The pending HITL request: id, kind, mode, prompt, optional choices, capability ref, integration, risk, and timestamp.',
          },
          {
            name: 'onApprove',
            type: '(hitlRequestId: string) => void',
            description: 'Called when the operator approves a confirmation request.',
          },
          {
            name: 'onReject',
            type: '(hitlRequestId: string) => void',
            description: 'Called when the operator rejects the request, in any mode.',
          },
          {
            name: 'onChoose',
            type: '(hitlRequestId: string, choiceId: string) => void',
            description: 'Called when the operator selects an option in a choice-mode request.',
          },
          {
            name: 'busy',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Disables every action and dims the card while a decision is in flight.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default ApprovalCardPage;

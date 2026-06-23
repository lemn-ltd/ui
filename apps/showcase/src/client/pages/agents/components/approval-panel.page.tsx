import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { ApprovalPanel, type ApprovalPanelMeta } from '@appranks/ui';
import type { ReactElement } from 'react';

const META: readonly ApprovalPanelMeta[] = [
  { label: 'Automation', value: 'Nightly Sync · run_8412' },
  { label: 'Requested by', value: 'classify agent' },
  { label: 'Graph hash', value: '0xA1B2C3 (at request)' },
];

function ApprovalPanelPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="The decision surface for an automation human-task node: request title and status, automation/run/requester/graph-hash context, an optional comment, and Approve/Reject actions. A graph-hash or stale-approval conflict blocks approval until the host re-validates."
      title="Approval panel"
    >
      <ExampleBlock
        code={`<ApprovalPanel
  title="Approve · deploy node"
  status="pending"
  meta={meta}
  conflict={{
    kind: 'graph-hash',
    title: 'Graph-hash conflict',
    description: 'The automation graph changed since this approval was created (0xA1B2C3 → 0xC3D4E5). Re-validate before approving.',
  }}
  onApprove={approve}
  onReject={reject}
/>`}
        render={() => (
          <div style={{ maxWidth: 480 }}>
            <ApprovalPanel
              conflict={{
                kind: 'graph-hash',
                title: 'Graph-hash conflict',
                description:
                  'The automation graph changed since this approval was created (0xA1B2C3 → 0xC3D4E5). Re-validate before approving.',
              }}
              meta={META}
              status="pending"
              title="Approve · deploy node"
            />
          </div>
        )}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'pending · no conflict',
            render: () => (
              <div style={{ maxWidth: 480 }}>
                <ApprovalPanel meta={META} status="pending" title="Approve · deploy node" />
              </div>
            ),
          },
          {
            label: 'stale approval',
            render: () => (
              <div style={{ maxWidth: 480 }}>
                <ApprovalPanel
                  conflict={{
                    kind: 'stale',
                    title: 'Stale approval',
                    description:
                      'This request has been pending for 3h and the run window has moved on. Re-validate before approving.',
                  }}
                  meta={META}
                  status="stale"
                  title="Confirm cleanup"
                />
              </div>
            ),
          },
          {
            label: 'approved',
            render: () => (
              <div style={{ maxWidth: 480 }}>
                <ApprovalPanel meta={META} status="approved" title="Approve · deploy node" />
              </div>
            ),
          },
          {
            label: 'rejected',
            render: () => (
              <div style={{ maxWidth: 480 }}>
                <ApprovalPanel meta={META} status="rejected" title="Approve · deploy node" />
              </div>
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'title',
            type: 'string',
            description: 'The request title, e.g. "Approve · deploy node".',
          },
          {
            name: 'status',
            type: "'pending' | 'approved' | 'rejected' | 'stale'",
            description: 'Decision state shown as a dotted pill.',
          },
          {
            name: 'meta',
            type: 'ApprovalPanelMeta[]',
            description: 'Automation/run/requester/graph-hash context rows.',
          },
          {
            name: 'conflict',
            type: '{ kind: "graph-hash" | "stale"; title; description }',
            description: 'When present, renders a warning and blocks approval.',
          },
          {
            name: 'comment / onCommentChange',
            type: 'string / (value) => void',
            description: 'Controlled approval note.',
          },
          {
            name: 'onApprove / onReject / busy / approveDisabled',
            type: '() => void / boolean',
            description: 'Decision callbacks and action gating.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default ApprovalPanelPage;

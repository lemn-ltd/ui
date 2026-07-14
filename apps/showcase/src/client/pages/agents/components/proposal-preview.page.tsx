import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@lemn-ltd/showcase-kit';
import { type ProposalNode, ProposalPreview } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const NODES: readonly ProposalNode[] = [
  { kind: 'trigger', label: 'pull_request' },
  { kind: 'agent', label: 'classify_urgency' },
  { kind: 'condition', label: 'is_urgent == true' },
  { kind: 'action', label: 'notify_team' },
  { kind: 'human_task', label: 'approve_deploy' },
  { kind: 'action', label: 'deploy' },
];

function ProposalPreviewPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="The review surface for a generated automation graph: a monospace preview of the proposed nodes, a compile-result banner, and Accept/Reject actions. Accept is blocked until the proposal compiles cleanly."
      title="Proposal preview"
    >
      <ExampleBlock
        code={`<ProposalPreview
  nodes={nodes}
  compile={{ status: 'success', message: 'Compiled successfully · 6 nodes · 5 edges · 0 errors.' }}
  onAccept={accept}
  onReject={reject}
/>`}
        render={() => (
          <div style={{ maxWidth: 560 }}>
            <ProposalPreview
              compile={{
                status: 'success',
                message:
                  'Compiled successfully · 6 nodes · 5 edges · 0 errors. Proposal ready to accept.',
              }}
              nodes={NODES}
            />
          </div>
        )}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'compile error',
            render: () => (
              <div style={{ maxWidth: 560 }}>
                <ProposalPreview
                  compile={{
                    status: 'error',
                    message:
                      'Compile failed · 2 errors · dangling edge into "deploy". Fix the plan and recompile.',
                  }}
                  nodes={NODES}
                />
              </div>
            ),
          },
          {
            label: 'compiling',
            render: () => (
              <div style={{ maxWidth: 560 }}>
                <ProposalPreview
                  compile={{ status: 'pending', message: 'Compiling proposal…' }}
                  nodes={NODES}
                />
              </div>
            ),
          },
          {
            label: 'empty',
            render: () => (
              <div style={{ maxWidth: 560 }}>
                <ProposalPreview nodes={[]} />
              </div>
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'nodes',
            type: 'ProposalNode[]',
            description: 'Proposed nodes: kind + label, rendered as a monospace preview.',
          },
          {
            name: 'compile',
            type: '{ status: "pending" | "success" | "error"; message }',
            description: 'Compile result banner; success unlocks Accept.',
          },
          {
            name: 'onAccept / onReject / busy',
            type: '() => void / boolean',
            description: 'Decision callbacks; Accept is blocked unless compile succeeded.',
          },
          {
            name: 'title / emptyHint',
            type: 'string',
            description: 'Preview heading and empty-state copy overrides.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default ProposalPreviewPage;

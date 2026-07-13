import { ComponentPage } from '@appranks/showcase-kit';
import {
  AgentActivityLine,
  AgentMessageBubble,
  AgentReasoningBlock,
  AgentToolCallList,
  Badge,
  Card,
  Composer,
  ListShell,
  PageHeader,
  Sidebar,
  type SidebarNavGroup,
  TopBar,
  type AgentToolCallPart,
  UserMessageBubble,
} from '@lemn-ltd/ui';
import { type CSSProperties, type ReactElement, useState } from 'react';
import { relativeNow } from '../../../fixtures';

const FRAME: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  height: 700,
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  background: 'var(--bg)',
};

const MAIN: CSSProperties = { display: 'flex', flexDirection: 'column', minWidth: 0 };
const CONTENT: CSSProperties = { flex: 1, minHeight: 0, overflow: 'auto' };

const SESSION_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 280px',
  gap: 'var(--space-4)',
  alignItems: 'start',
};

const THREAD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  minWidth: 0,
};

const SIDE_PANEL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const META_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-3)',
  color: 'var(--text-muted)',
  fontSize: 'var(--font-size-small)',
};

const AGENT_NAV_GROUPS: readonly SidebarNavGroup[] = [
  {
    header: 'Agents',
    items: [
      { id: 'agent-session', label: 'Agent session', icon: 'users', active: true },
      { id: 'tool-calls', label: 'Tool calls', icon: 'wrench' },
      { id: 'approvals', label: 'Approvals', icon: 'user-check' },
    ],
  },
  {
    header: 'Patterns',
    items: [
      { id: 'session-pattern', label: 'Agent session', icon: 'users', active: true },
      { id: 'builder-pattern', label: 'Automation builder', icon: 'layout-grid' },
      { id: 'monitor-pattern', label: 'Run monitor', icon: 'clock' },
    ],
  },
];

const TOOL_CALLS: readonly AgentToolCallPart[] = [
  {
    id: 'search-files',
    name: 'workspace.search_files',
    title: 'Find run evidence',
    status: 'completed',
    time: { start: relativeNow - 98_000, end: relativeNow - 96_400 },
    input: { query: 'failed deploy timeout', scope: 'current workspace' },
    output: [
      {
        kind: 'text',
        text: 'Found 3 matching records: deploy attempt, approval note, runtime refs.',
      },
    ],
    execution: {
      requestedStage: 'workspace',
      minimumStage: 'workspace',
      selectedStage: 'workspace',
      escalated: false,
      policyDecision: 'allowed',
      providerKind: 'workspace',
      adapterKind: 'indexed-search',
      environmentRef: 'ws_current',
      reason: 'Read-only search over workspace metadata.',
    },
  },
  {
    id: 'read-run',
    name: 'runtime.read_run',
    title: 'Load latest attempt',
    status: 'completed',
    time: { start: relativeNow - 91_000, end: relativeNow - 88_200 },
    input: { runId: 'rrun_71c4d8' },
    output: [{ kind: 'json', value: { attempts: 3, failedNode: 'deploy', duration: '2.4s' } }],
  },
];

function AgentSessionPage(): ReactElement {
  const [composerValue, setComposerValue] = useState('Draft the remediation steps.');

  return (
    <ComponentPage
      status="beta"
      summary="A focused agent conversation surface: the shell contains activity, user and agent bubbles, reasoning, tool calls, a compact context panel, and a composer pinned at the bottom."
      title="Agent session"
    >
      <div style={FRAME}>
        <Sidebar groups={AGENT_NAV_GROUPS} mode="expanded" />
        <div style={MAIN}>
          <TopBar />
          <div style={CONTENT}>
            <ListShell>
              <PageHeader
                actions={
                  <Badge showDot tone="info" variant="soft">
                    Running
                  </Badge>
                }
                subtitle="One operator, one agent, and an inspectable stream of evidence."
                title="Deployment remediation"
              />

              <div style={SESSION_GRID}>
                <section aria-label="Conversation thread" style={THREAD}>
                  <AgentActivityLine
                    agentName="Remediation agent"
                    pulse
                    state="working"
                    toolName="runtime.read_run"
                  />
                  <UserMessageBubble
                    content="The deploy node timed out. Find the cause and suggest the safest next step."
                    createdAt={relativeNow - 180_000}
                    now={relativeNow}
                  />
                  <AgentMessageBubble
                    content="I found the failed deploy attempt and the approval context. The timeout happened after the graph was updated, so the approval must be revalidated before retrying."
                    createdAt={relativeNow - 82_000}
                    now={relativeNow}
                  >
                    <AgentReasoningBlock
                      defaultOpen
                      durationMs={42_000}
                      entries={[
                        {
                          id: 'scope',
                          state: 'done',
                          text: 'Checked the latest run, compared the graph hash, and confirmed the deploy node consumed all retry attempts.',
                        },
                      ]}
                    />
                    <AgentToolCallList toolCalls={TOOL_CALLS} />
                  </AgentMessageBubble>
                  <Composer
                    aria-label="Message agent"
                    footerSlot={<span>Enter to send</span>}
                    onChange={setComposerValue}
                    onSubmit={() => setComposerValue('')}
                    placeholder="Ask for the next safe action"
                    value={composerValue}
                  />
                </section>

                <aside aria-label="Session context" style={SIDE_PANEL}>
                  <Card title="Run context">
                    <div style={META_ROW}>
                      <span>Run</span>
                      <code>rrun_71c4d8</code>
                    </div>
                    <div style={META_ROW}>
                      <span>Graph</span>
                      <code>0xC3D4E5</code>
                    </div>
                    <div style={META_ROW}>
                      <span>Approval</span>
                      <Badge tone="warn" variant="soft">
                        revalidate
                      </Badge>
                    </div>
                  </Card>
                  <Card title="Policy">
                    <div style={META_ROW}>
                      <span>Reads</span>
                      <Badge tone="success" variant="soft">
                        allowed
                      </Badge>
                    </div>
                    <div style={META_ROW}>
                      <span>Writes</span>
                      <Badge tone="warn" variant="soft">
                        approval
                      </Badge>
                    </div>
                  </Card>
                </aside>
              </div>
            </ListShell>
          </div>
        </div>
      </div>
    </ComponentPage>
  );
}

export default AgentSessionPage;

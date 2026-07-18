import { ComponentPage } from '@portal/catalog-kit';
import {
  ApprovalPanel,
  type ApprovalPanelMeta,
  AutomationStatusBadge,
  Card,
  ListShell,
  type NodeAttempt,
  NodeAttemptsTable,
  PageHeader,
  RunTimeline,
  type RunTimelineEvent,
  RuntimeRefsPanel,
  type RuntimeMetric,
  type RuntimeRef,
  Sidebar,
  type SidebarNavGroup,
  StatsStrip,
  type StatCardProps,
  TopBar,
} from '@lemn-ltd/ui';
import type { CSSProperties, ReactElement } from 'react';

const FRAME: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  height: 720,
  border: '1px solid var(--lemn-color-border)',
  borderRadius: 'var(--lemn-radius-large)',
  overflow: 'hidden',
  background: 'var(--lemn-color-canvas)',
};

const MAIN: CSSProperties = { display: 'flex', flexDirection: 'column', minWidth: 0 };
const CONTENT: CSSProperties = { flex: 1, minHeight: 0, overflow: 'auto' };

const MONITOR_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 360px',
  gap: 'var(--lemn-space-4)',
  alignItems: 'start',
};

const STACK: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--lemn-space-4)',
  minWidth: 0,
};

const AGENT_NAV_GROUPS: readonly SidebarNavGroup[] = [
  {
    header: 'Agents',
    items: [
      { id: 'runs', label: 'Runs', icon: 'clock', active: true },
      { id: 'timeline', label: 'Timeline', icon: 'clock' },
      { id: 'attempts', label: 'Attempts', icon: 'list' },
    ],
  },
  {
    header: 'Patterns',
    items: [
      { id: 'session-pattern', label: 'Agent session', icon: 'users' },
      { id: 'builder-pattern', label: 'Automation builder', icon: 'layout-grid' },
      { id: 'monitor-pattern', label: 'Run monitor', icon: 'clock', active: true },
    ],
  },
];

const RUN_STATS: readonly StatCardProps[] = [
  { label: 'Duration', value: '04:18', delta: { direction: 'up', label: '+32s' } },
  { label: 'Attempts', value: '6', delta: { direction: 'flat', label: '3 nodes' } },
  { label: 'Approvals', value: '1', delta: { direction: 'flat', label: 'waiting' } },
  { label: 'Cost', value: '$0.42', delta: { direction: 'down', label: '-8%' } },
];

const EVENTS: readonly RunTimelineEvent[] = [
  { id: 'queued', time: '09:00:00', message: 'Run queued from weekday schedule.', tone: 'info' },
  { id: 'started', time: '09:00:03', message: 'Classifier agent started.', tone: 'success' },
  { id: 'retry', time: '09:01:26', message: 'Deploy node retried after timeout.', tone: 'warn' },
  { id: 'approval', time: '09:02:11', message: 'Approval requested for publish action.', tone: 'warn' },
  { id: 'blocked', time: '09:04:18', message: 'Run blocked by graph-hash conflict.', tone: 'danger' },
];

const ATTEMPTS: readonly NodeAttempt[] = [
  { node: 'schedule', type: 'trigger', attempt: 1, state: 'completed', duration: '0.1s' },
  { node: 'classify', type: 'agent', attempt: 1, state: 'completed', duration: '1.2s' },
  { node: 'deploy', type: 'action', attempt: 1, state: 'failed', duration: '2.4s', error: 'timeout' },
  { node: 'deploy', type: 'action', attempt: 2, state: 'failed', duration: '2.4s', error: 'timeout' },
  { node: 'approve', type: 'human_task', attempt: 1, state: 'waiting', error: 'revalidate graph' },
];

const REFS: readonly RuntimeRef[] = [
  { label: 'RuntimeSession', value: 'rsess_9f2a4c7e' },
  { label: 'RuntimeRun', value: 'rrun_71c4d8 · attempt 3 / 3' },
  { label: 'Source ref', value: 'automation : weekday_publish : v12' },
];

const METRICS: readonly RuntimeMetric[] = [
  { label: 'Max turns', value: '8' },
  { label: 'Tokens', value: '12.4k / 50k' },
  { label: 'Safety', value: 'enforced' },
  { label: 'Knowledge', value: '3 sources' },
];

const APPROVAL_META: readonly ApprovalPanelMeta[] = [
  { label: 'Automation', value: 'Weekday publish · run_71c4d8' },
  { label: 'Requested by', value: 'publish agent' },
  { label: 'Graph hash', value: '0xA1B2C3 → 0xC3D4E5' },
];

function RunMonitorPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="An execution monitoring surface: summary stats, chronological evidence, node attempts, runtime refs, and the approval panel live together without turning each component into a one-off screen."
      title="Run monitor"
    >
      <div style={FRAME}>
        <Sidebar groups={AGENT_NAV_GROUPS} mode="expanded" />
        <div style={MAIN}>
          <TopBar />
          <div style={CONTENT}>
            <ListShell>
              <PageHeader
                actions={<AutomationStatusBadge status="waiting" />}
                subtitle="Inspect the evidence chain before retrying or approving a blocked run."
                title="Run rrun_71c4d8"
              />
              <StatsStrip stats={RUN_STATS} />

              <div style={MONITOR_GRID}>
                <div style={STACK}>
                  <Card title="Timeline evidence">
                    <RunTimeline events={EVENTS} />
                  </Card>
                  <Card title="Node attempts">
                    <NodeAttemptsTable attempts={ATTEMPTS} />
                  </Card>
                </div>

                <aside style={STACK}>
                  <RuntimeRefsPanel metrics={METRICS} refs={REFS} />
                  <ApprovalPanel
                    conflict={{
                      kind: 'graph-hash',
                      title: 'Graph-hash conflict',
                      description:
                        'The automation graph changed after this approval was created. Re-validate before approving the publish action.',
                    }}
                    meta={APPROVAL_META}
                    status="pending"
                    title="Approve publish action"
                  />
                </aside>
              </div>
            </ListShell>
          </div>
        </div>
      </div>
    </ComponentPage>
  );
}

export default RunMonitorPage;

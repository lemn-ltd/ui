import { ComponentPage } from '@appranks/showcase-kit';
import {
  GraphCanvas,
  type GraphCanvasEdge,
  type GraphCanvasNode,
  ListShell,
  NodeInspector,
  type NodeInspectorField,
  type NodeInspectorTab,
  NodePalette,
  type NodePaletteItem,
  PageHeader,
  PlannerStatus,
  ProposalPreview,
  Sidebar,
  type SidebarNavGroup,
  TopBar,
  TriggerComposer,
  type ComposerTrigger,
} from '@lemn-ltd/ui';
import { type CSSProperties, type ReactElement, useState } from 'react';

const FRAME: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  height: 720,
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  background: 'var(--bg)',
};

const MAIN: CSSProperties = { display: 'flex', flexDirection: 'column', minWidth: 0 };
const CONTENT: CSSProperties = { flex: 1, minHeight: 0, overflow: 'auto' };

const BUILDER_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '320px minmax(0, 1fr)',
  gap: 'var(--space-4)',
  alignItems: 'start',
};

const RIGHT_STACK: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  minWidth: 0,
};

const INSPECTOR_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '220px minmax(260px, 1fr) minmax(260px, 1fr)',
  gap: 'var(--space-4)',
  alignItems: 'start',
};

const AGENT_NAV_GROUPS: readonly SidebarNavGroup[] = [
  {
    header: 'Agents',
    items: [
      { id: 'graph', label: 'Automation graph', icon: 'layout-grid', active: true },
      { id: 'planner', label: 'Planner', icon: 'layout-grid' },
      { id: 'inspector', label: 'Inspector', icon: 'panel-right-open' },
    ],
  },
  {
    header: 'Patterns',
    items: [
      { id: 'session-pattern', label: 'Agent session', icon: 'users' },
      { id: 'builder-pattern', label: 'Automation builder', icon: 'layout-grid', active: true },
      { id: 'monitor-pattern', label: 'Run monitor', icon: 'clock' },
    ],
  },
];

const TRIGGERS: readonly ComposerTrigger[] = [
  {
    id: 'daily',
    kind: 'schedule',
    timezoneLabel: 'GMT+4',
    value: { preset: 'weekdays', atTime: '09:00' },
  },
  {
    id: 'api',
    kind: 'generic',
    icon: 'code',
    label: 'Call via API',
    description: 'Allows a trusted service to trigger a run.',
  },
];

const NODES: readonly GraphCanvasNode[] = [
  { id: 'trigger', kind: 'trigger', name: 'weekday schedule', state: 'completed', x: 24, y: 32 },
  { id: 'plan', kind: 'planner', name: 'draft graph', state: 'running', x: 280, y: 32 },
  { id: 'classify', kind: 'agent', name: 'classify request', state: 'idle', x: 280, y: 148 },
  { id: 'needs-human', kind: 'condition', name: 'needs approval', state: 'idle', x: 536, y: 148 },
  { id: 'approve', kind: 'human_task', name: 'manager approval', state: 'waiting', x: 536, y: 264 },
  { id: 'notify', kind: 'action', name: 'notify channel', state: 'idle', x: 280, y: 264 },
];

const EDGES: readonly GraphCanvasEdge[] = [
  { from: 'trigger', to: 'plan' },
  { from: 'plan', to: 'classify' },
  { from: 'classify', to: 'needs-human' },
  { from: 'needs-human', to: 'approve' },
  { from: 'needs-human', to: 'notify' },
];

const PALETTE: readonly NodePaletteItem[] = [
  { kind: 'trigger', label: 'Trigger', icon: 'radio' },
  { kind: 'planner', label: 'Planner', icon: 'layout-grid' },
  { kind: 'agent', label: 'Agent', icon: 'users' },
  { kind: 'condition', label: 'Condition', icon: 'code' },
  { kind: 'human_task', label: 'Human task', icon: 'user-check' },
  { kind: 'action', label: 'Action', icon: 'wrench' },
];

const INSPECTOR_TABS: readonly NodeInspectorTab[] = [
  { value: 'config', label: 'Config' },
  { value: 'policy', label: 'Policy' },
  { value: 'knowledge', label: 'Knowledge' },
];

const INSPECTOR_FIELDS: readonly NodeInspectorField[] = [
  { label: 'Agent ref', value: 'request-classifier@v3', mono: true },
  { label: 'Max turns', value: '6', mono: true },
  { label: 'Approval path', value: 'manager approval' },
];

function AutomationBuilderPage(): ReactElement {
  const [selectedNodeId, setSelectedNodeId] = useState('classify');

  const selectedNode = NODES.find((node) => node.id === selectedNodeId) ?? NODES[2];

  return (
    <ComponentPage
      status="beta"
      summary="A graph authoring workflow for automations: triggers define entry points, the graph canvas shows the planned nodes, and the lower rail combines a node palette, inspector, and proposal review."
      title="Automation builder"
    >
      <div style={FRAME}>
        <Sidebar groups={AGENT_NAV_GROUPS} mode="expanded" />
        <div style={MAIN}>
          <TopBar />
          <div style={CONTENT}>
            <ListShell>
              <PageHeader
                actions={<PlannerStatus state="streaming" />}
                subtitle="Compose triggers, inspect nodes, and review the generated graph before publishing."
                title="Automation builder"
              />

              <div style={BUILDER_GRID}>
                <TriggerComposer label="Entry points" triggers={TRIGGERS} />
                <div style={RIGHT_STACK}>
                  <GraphCanvas
                    edges={EDGES}
                    height={360}
                    nodes={NODES}
                    onSelectNode={setSelectedNodeId}
                    selectedNodeId={selectedNodeId}
                  />
                  <div style={INSPECTOR_GRID}>
                    <NodePalette items={PALETTE} selectedKind={selectedNode?.kind} />
                    <NodeInspector
                      activeTab="config"
                      fields={INSPECTOR_FIELDS}
                      kind={selectedNode?.kind}
                      nodeName={selectedNode?.name}
                      tabs={INSPECTOR_TABS}
                    />
                    <ProposalPreview
                      compile={{
                        status: 'success',
                        message: 'Graph compiles cleanly with one approval gate.',
                      }}
                      nodes={[
                        { kind: 'trigger', label: 'weekday schedule' },
                        { kind: 'planner', label: 'draft graph' },
                        { kind: 'agent', label: 'classify request' },
                        { kind: 'human_task', label: 'manager approval' },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </ListShell>
          </div>
        </div>
      </div>
    </ComponentPage>
  );
}

export default AutomationBuilderPage;

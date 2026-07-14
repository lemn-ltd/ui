import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@lemn-ltd/showcase-kit';
import {
  GraphCanvas,
  type GraphCanvasEdge,
  type GraphCanvasNode,
  GraphNode,
  type GraphNodeKind,
  type NodeState,
  NodeStateChip,
} from '@lemn-ltd/ui';
import type { CSSProperties, ReactElement } from 'react';

const SECTION_TITLE: CSSProperties = {
  margin: 0,
  color: 'var(--text)',
  fontSize: 'var(--font-size-heading)',
  fontWeight: 'var(--font-weight-semibold)',
};

const NODES: readonly GraphCanvasNode[] = [
  { id: 'trigger', kind: 'trigger', name: 'schedule', state: 'completed', x: 40, y: 30 },
  { id: 'classify', kind: 'agent', name: 'classify', state: 'completed', x: 40, y: 140 },
  { id: 'condition', kind: 'condition', name: 'is_urgent', state: 'completed', x: 40, y: 250 },
  { id: 'notify', kind: 'action', name: 'notify', state: 'running', x: 360, y: 250 },
  { id: 'wait', kind: 'wait', name: '30s', state: 'waiting', x: 680, y: 140 },
  { id: 'approve', kind: 'human_task', name: 'approve', state: 'waiting', x: 680, y: 250 },
  { id: 'deploy', kind: 'action', name: 'deploy', state: 'failed', x: 360, y: 360 },
];

const EDGES: readonly GraphCanvasEdge[] = [
  { from: 'trigger', to: 'classify' },
  { from: 'classify', to: 'condition' },
  { from: 'condition', to: 'notify' },
  { from: 'notify', to: 'deploy' },
  { from: 'wait', to: 'approve' },
];

const NODE_KINDS: readonly GraphNodeKind[] = [
  'trigger',
  'agent',
  'action',
  'condition',
  'wait',
  'human_task',
  'planner',
];

const NODE_STATES: readonly NodeState[] = [
  'idle',
  'running',
  'waiting',
  'completed',
  'failed',
  'skipped',
];

function AutomationGraphPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A read-only automation graph: typed GraphNodes positioned on an absolute GraphCanvas, connected by orthogonal edges and toned by execution state, with an inline NodeStateChip legend. Not an interactive editor — selection is delegated to the host."
      title="Automation graph"
    >
      <ExampleBlock
        code={`<GraphCanvas
  nodes={nodes}
  edges={edges}
  selectedNodeId="notify"
  onSelectNode={(id) => select(id)}
/>`}
        render={() => (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ width: 920 }}>
              <GraphCanvas edges={EDGES} nodes={NODES} selectedNodeId="notify" />
            </div>
          </div>
        )}
      />

      <VariantsGallery
        items={[
          {
            label: 'empty',
            render: () => (
              <div style={{ width: 360 }}>
                <GraphCanvas height={180} nodes={[]} showLegend={false} />
              </div>
            ),
          },
        ]}
      />

      <h2 style={SECTION_TITLE}>GraphNode</h2>
      <VariantsGallery
        items={[
          ...NODE_STATES.map((state) => ({
            label: state,
            render: () => (
              <div style={{ width: 200 }}>
                <GraphNode kind="agent" name="classify" state={state} />
              </div>
            ),
          })),
          {
            label: 'selected',
            render: () => (
              <div style={{ width: 200 }}>
                <GraphNode kind="action" name="deploy" selected state="running" />
              </div>
            ),
          },
        ]}
      />
      <VariantsGallery
        items={NODE_KINDS.map((kind) => ({
          label: kind,
          render: () => (
            <div style={{ width: 200 }}>
              <GraphNode kind={kind} name="node" state="completed" />
            </div>
          ),
        }))}
      />

      <h2 style={SECTION_TITLE}>NodeStateChip</h2>
      <VariantsGallery
        items={[
          ...NODE_STATES.map((state) => ({
            label: `badge · ${state}`,
            render: () => <NodeStateChip state={state} />,
          })),
          ...NODE_STATES.map((state) => ({
            label: `inline · ${state}`,
            render: () => <NodeStateChip appearance="inline" state={state} />,
          })),
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'GraphCanvas.nodes',
            type: 'GraphCanvasNode[]',
            description: 'Positioned nodes: id, kind, name, state, and x/y (px).',
          },
          {
            name: 'GraphCanvas.edges',
            type: 'GraphCanvasEdge[]',
            description: 'from/to node ids; rendered as orthogonal connectors.',
          },
          {
            name: 'GraphCanvas.selectedNodeId / onSelectNode',
            type: 'string / (id) => void',
            description: 'Host-owned selection; the canvas only reflects it.',
          },
          {
            name: 'GraphCanvas.showLegend / legendStates',
            type: 'boolean / NodeState[]',
            description: 'Toggle and customize the inline state legend.',
          },
          {
            name: 'GraphNode.kind / name / state / selected',
            type: 'GraphNodeKind / string / NodeState / boolean',
            description: 'A focusable node card; border and dot color resolve from state.',
          },
          {
            name: 'NodeStateChip.state / appearance',
            type: "NodeState / 'badge' | 'inline'",
            description: 'Pill (table) or bare dot + label (legend) for a node state.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default AutomationGraphPage;

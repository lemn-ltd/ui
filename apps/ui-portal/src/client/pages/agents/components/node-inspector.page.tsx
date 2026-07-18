import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@portal/catalog-kit';
import {
  NodeInspector,
  type NodeInspectorField,
  type NodeInspectorTab,
  NodePalette,
  type NodePaletteItem,
} from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const PALETTE: readonly NodePaletteItem[] = [
  { kind: 'trigger', label: 'Trigger', icon: 'radio' },
  { kind: 'agent', label: 'Agent', icon: 'users' },
  { kind: 'action', label: 'Action', icon: 'wrench' },
  { kind: 'condition', label: 'Condition', icon: 'code' },
  { kind: 'wait', label: 'Wait', icon: 'clock' },
  { kind: 'human_task', label: 'Human task', icon: 'user-check' },
  { kind: 'planner', label: 'Planner', icon: 'layout-grid' },
];

const TABS: readonly NodeInspectorTab[] = [
  { value: 'config', label: 'Config' },
  { value: 'policy', label: 'Policy' },
  { value: 'knowledge', label: 'Knowledge' },
];

const FIELDS: readonly NodeInspectorField[] = [
  { label: 'Agent ref', value: 'support-classifier@v4', mono: true },
  { label: 'Model', value: '@cf/meta/llama-3.3-70b', mono: true },
  { label: 'Max turns', value: '8', mono: true },
];

function NodeInspectorPage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="The detail panel for a selected graph node — a kind pill, a config/policy/knowledge tab strip, and label/value rows — beside the authoring node palette. Both are presentational and controlled by the host."
      title="Node inspector"
    >
      <ExampleBlock
        code={`<NodePalette items={items} selectedKind="agent" onSelect={addNode} />
<NodeInspector
  nodeName="classify"
  kind="agent"
  tabs={tabs}
  activeTab="config"
  fields={fields}
/>`}
        render={() => (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--lemn-space-4)' }}>
            <div style={{ width: 240 }}>
              <NodePalette items={PALETTE} selectedKind="agent" />
            </div>
            <div style={{ width: 480 }}>
              <NodeInspector
                activeTab="config"
                fields={FIELDS}
                kind="agent"
                nodeName="classify"
                tabs={TABS}
              />
            </div>
          </div>
        )}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'empty · no selection',
            render: () => (
              <div style={{ width: 480 }}>
                <NodeInspector />
              </div>
            ),
          },
          {
            label: 'condition node',
            render: () => (
              <div style={{ width: 480 }}>
                <NodeInspector
                  fields={[{ label: 'Expression', value: 'is_urgent == true', mono: true }]}
                  kind="condition"
                  nodeName="is_urgent"
                />
              </div>
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'NodeInspector.nodeName',
            type: 'string',
            description: 'The selected node; when absent, the inspector shows its empty state.',
          },
          {
            name: 'NodeInspector.kind / kindLabel',
            type: 'GraphNodeKind / string',
            description: 'Drives the kind pill text and tone.',
          },
          {
            name: 'NodeInspector.tabs / activeTab / onTabChange',
            type: 'NodeInspectorTab[] / string / (value) => void',
            description: 'Optional controlled tab strip (config / policy / knowledge).',
          },
          {
            name: 'NodeInspector.fields',
            type: 'NodeInspectorField[]',
            description: 'Label/value rows; set mono for refs, model ids, and limits.',
          },
          {
            name: 'NodePalette.items',
            type: 'NodePaletteItem[]',
            description: 'Node kinds the operator can add; each row is a button.',
          },
          {
            name: 'NodePalette.selectedKind / onSelect',
            type: 'GraphNodeKind / (kind) => void',
            description: 'Host-owned active kind and add callback.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default NodeInspectorPage;

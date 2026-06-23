import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { EmptyState } from '../../data-display/index.js';
import { SegmentedControl } from '../../forms/index.js';
import { Badge, type BadgeTone } from '../../primitives/index.js';
import type { GraphNodeKind } from '../graph-node/graph-node.js';
import './node-inspector.css';

export interface NodeInspectorField {
  readonly label: string;
  readonly value: ReactNode;
  /** Renders the value as monospace, for refs, model ids, and limits. */
  readonly mono?: boolean;
}

export interface NodeInspectorTab {
  readonly value: string;
  readonly label: string;
}

export interface NodeInspectorProps extends HTMLAttributes<HTMLDivElement> {
  /** The selected node's name. When absent the inspector renders its empty state. */
  readonly nodeName?: string;
  readonly kind?: GraphNodeKind;
  /** Override the kind pill text; defaults to `<kind> node`. */
  readonly kindLabel?: string;

  readonly tabs?: readonly NodeInspectorTab[];
  readonly activeTab?: string;
  readonly onTabChange?: (value: string) => void;

  readonly fields?: readonly NodeInspectorField[];
  readonly emptyHint?: string;
}

const KIND_TONE: Record<GraphNodeKind, BadgeTone> = {
  trigger: 'success',
  agent: 'info',
  action: 'info',
  condition: 'accent2',
  wait: 'warn',
  human_task: 'warn',
  planner: 'accent2',
};

const KIND_NOUN: Record<GraphNodeKind, string> = {
  trigger: 'trigger',
  agent: 'agent',
  action: 'action',
  condition: 'condition',
  wait: 'wait',
  human_task: 'human task',
  planner: 'planner',
};

/**
 * The detail panel for a selected graph node: a header with the node name and a
 * kind pill, an optional tab strip (config / policy / knowledge), and a list of
 * label/value rows. Presentational and controlled — tab state is owned by the
 * host. With no `nodeName` it shows a select-a-node empty state.
 */
export function NodeInspector({
  nodeName,
  kind,
  kindLabel,
  tabs,
  activeTab,
  onTabChange,
  fields = [],
  emptyHint = 'Select a node on the canvas to inspect and configure it.',
  className,
  ...rest
}: NodeInspectorProps): ReactElement {
  if (!nodeName) {
    return (
      <div className={['ui-node-inspector', className].filter(Boolean).join(' ')} {...rest}>
        <EmptyState description={emptyHint} icon="pointer" title="No node selected" />
      </div>
    );
  }

  const pillText = kind ? (kindLabel ?? `${KIND_NOUN[kind]} node`) : kindLabel;

  return (
    <div className={['ui-node-inspector', className].filter(Boolean).join(' ')} {...rest}>
      <div className="ui-node-inspector__header">
        <h3 className="ui-node-inspector__title">{nodeName}</h3>
        {pillText ? (
          <Badge showDot tone={kind ? KIND_TONE[kind] : 'neutral'} variant="soft">
            {pillText}
          </Badge>
        ) : null}
      </div>

      {tabs && tabs.length > 0 ? (
        <SegmentedControl
          aria-label="Node inspector section"
          onValueChange={onTabChange}
          segments={tabs.map((tab) => ({ value: tab.value, label: tab.label }))}
          value={activeTab}
        />
      ) : null}

      {fields.length > 0 ? (
        <div className="ui-node-inspector__fields">
          {fields.map((field) => (
            <div className="ui-node-inspector__field" key={field.label}>
              <span className="ui-node-inspector__field-label">{field.label}</span>
              <div
                className="ui-node-inspector__field-value"
                data-mono={field.mono ? 'true' : 'false'}
              >
                {field.value}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

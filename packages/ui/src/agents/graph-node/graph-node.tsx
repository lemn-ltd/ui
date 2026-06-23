import type { ButtonHTMLAttributes, ReactElement } from 'react';
import type { NodeState } from '../node-state-chip/node-state-chip.js';
import './graph-node.css';

/** The deterministic and agent node kinds an automation graph can contain. */
export type GraphNodeKind =
  | 'trigger'
  | 'agent'
  | 'action'
  | 'condition'
  | 'wait'
  | 'human_task'
  | 'planner';

export interface GraphNodeProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly kind: GraphNodeKind;
  readonly name: string;
  readonly state?: NodeState;
  readonly selected?: boolean;
}

const KIND_LABEL: Record<GraphNodeKind, string> = {
  trigger: 'Trigger',
  agent: 'Agent',
  action: 'Action',
  condition: 'Condition',
  wait: 'Wait',
  human_task: 'Human task',
  planner: 'Planner',
};

/**
 * A single automation graph node as a focusable card: a state dot, the node
 * kind, and its name. The border and dot color resolve from the node's
 * execution `state`; `selected` raises a focus-style ring. Presentational — the
 * host owns selection via the forwarded button props.
 */
export function GraphNode({
  kind,
  name,
  state = 'idle',
  selected = false,
  type = 'button',
  className,
  ...rest
}: GraphNodeProps): ReactElement {
  return (
    <button
      className={['ui-graph-node', className].filter(Boolean).join(' ')}
      data-kind={kind}
      data-selected={selected ? 'true' : 'false'}
      data-state={state}
      type={type}
      {...rest}
    >
      <span aria-hidden="true" className="ui-graph-node__dot" />
      <span className="ui-graph-node__label">
        <span className="ui-graph-node__kind">{KIND_LABEL[kind]}</span>
        <span aria-hidden="true"> · </span>
        <span className="ui-graph-node__name">{name}</span>
      </span>
    </button>
  );
}

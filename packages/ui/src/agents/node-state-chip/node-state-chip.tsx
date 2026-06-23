import type { HTMLAttributes, ReactElement } from 'react';
import { Badge, type BadgeTone, type BadgeVariant } from '../../primitives/index.js';
import './node-state-chip.css';

/** The execution state of a single automation graph node. */
export type NodeState = 'idle' | 'running' | 'waiting' | 'completed' | 'failed' | 'skipped';

/**
 * `badge` renders the standard dotted pill used inside tables and inspectors;
 * `inline` renders a bare dot + label used in a graph legend.
 */
export type NodeStateChipAppearance = 'badge' | 'inline';

export interface NodeStateChipProps extends HTMLAttributes<HTMLSpanElement> {
  readonly state: NodeState;
  readonly label?: string;
  readonly appearance?: NodeStateChipAppearance;
  readonly variant?: BadgeVariant;
}

const STATE_TONE: Record<NodeState, BadgeTone> = {
  idle: 'neutral',
  running: 'info',
  waiting: 'warn',
  completed: 'success',
  failed: 'danger',
  skipped: 'dim',
};

const STATE_LABEL: Record<NodeState, string> = {
  idle: 'idle',
  running: 'running',
  waiting: 'waiting',
  completed: 'completed',
  failed: 'failed',
  skipped: 'skipped',
};

/**
 * The canonical indicator for an automation graph node's execution state. The
 * `badge` appearance reuses `Badge` so node rows read like every other status
 * pill; the `inline` appearance is the bare dot + label used in a canvas legend.
 * Both expose a stable `data-node-state` hook and resolve their dot color from
 * the design tokens per theme.
 */
export function NodeStateChip({
  state,
  label = STATE_LABEL[state],
  appearance = 'badge',
  variant = 'soft',
  className,
  ...rest
}: NodeStateChipProps): ReactElement {
  if (appearance === 'inline') {
    return (
      <span
        className={['ui-node-state-chip', className].filter(Boolean).join(' ')}
        data-appearance="inline"
        data-node-state={state}
        {...rest}
      >
        <span aria-hidden="true" className="ui-node-state-chip__dot" />
        <span className="ui-node-state-chip__label">{label}</span>
      </span>
    );
  }

  return (
    <Badge
      className={['ui-node-state-chip', className].filter(Boolean).join(' ')}
      data-appearance="badge"
      data-node-state={state}
      showDot
      tone={STATE_TONE[state]}
      variant={variant}
      {...rest}
    >
      {label}
    </Badge>
  );
}

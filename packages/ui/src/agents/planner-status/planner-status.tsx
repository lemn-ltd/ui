import type { HTMLAttributes, ReactElement } from 'react';
import { Badge, type BadgeTone, type BadgeVariant } from '../../primitives/index.js';
import './planner-status.css';

/** The runtime state of the graph planner while it generates a proposal. */
export type PlannerState = 'idle' | 'planning' | 'streaming' | 'compiled' | 'failed';

export interface PlannerStatusProps extends HTMLAttributes<HTMLSpanElement> {
  readonly state: PlannerState;
  readonly label?: string;
  readonly variant?: BadgeVariant;
}

const STATE_TONE: Record<PlannerState, BadgeTone> = {
  idle: 'dim',
  planning: 'success',
  streaming: 'info',
  compiled: 'neutral',
  failed: 'danger',
};

const STATE_LABEL: Record<PlannerState, string> = {
  idle: 'Idle',
  planning: 'Planning',
  streaming: 'Streaming',
  compiled: 'Compiled',
  failed: 'Failed',
};

/**
 * The planner runtime indicator for the planned-graph flow. A dotted pill toned
 * by state, with the dot pulsing while the planner is actively `planning` or
 * `streaming`. Reuses `Badge`; exposes a stable `data-planner-state` hook.
 */
export function PlannerStatus({
  state,
  label = STATE_LABEL[state],
  variant = 'soft',
  className,
  ...rest
}: PlannerStatusProps): ReactElement {
  const active = state === 'planning' || state === 'streaming';
  return (
    <Badge
      className={['ui-planner-status', className].filter(Boolean).join(' ')}
      data-planner-state={state}
      data-pulse={active ? 'true' : 'false'}
      showDot
      tone={STATE_TONE[state]}
      variant={variant}
      {...rest}
    >
      {label}
    </Badge>
  );
}

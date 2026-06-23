import type { HTMLAttributes, ReactElement } from 'react';
import { Badge, type BadgeTone, type BadgeVariant, Icon } from '../../primitives/index.js';
import './wait-chip.css';

/** The lifecycle of a wait timer between two graph nodes. */
export type WaitState = 'pending' | 'active' | 'completed' | 'cancelled';

export interface WaitChipProps extends HTMLAttributes<HTMLSpanElement> {
  /** The wait duration or countdown, e.g. `30s` or `in 28s`. */
  readonly label: string;
  readonly state?: WaitState;
  readonly variant?: BadgeVariant;
}

const STATE_TONE: Record<WaitState, BadgeTone> = {
  pending: 'warn',
  active: 'info',
  completed: 'success',
  cancelled: 'dim',
};

/**
 * A compact pill for a wait timer: a clock glyph and the duration or countdown,
 * toned by the wait `state`. Reuses `Badge` so it reads like every other status
 * pill in a graph, table, or scheduler row.
 */
export function WaitChip({
  label,
  state = 'pending',
  variant = 'soft',
  className,
  ...rest
}: WaitChipProps): ReactElement {
  return (
    <Badge
      className={['ui-wait-chip', className].filter(Boolean).join(' ')}
      data-wait-state={state}
      tone={STATE_TONE[state]}
      variant={variant}
      {...rest}
    >
      <Icon name="clock" size={12} />
      {label}
    </Badge>
  );
}

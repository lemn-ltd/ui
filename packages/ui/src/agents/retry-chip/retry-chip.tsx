import type { HTMLAttributes, ReactElement } from 'react';
import { Badge, type BadgeTone, type BadgeVariant, Icon } from '../../primitives/index.js';
import './retry-chip.css';

/** The lifecycle of a node's retry policy across attempts. */
export type RetryState = 'scheduled' | 'retrying' | 'failed' | 'exhausted' | 'succeeded';

export interface RetryChipProps extends HTMLAttributes<HTMLSpanElement> {
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly state?: RetryState;
  /** Optional trailing detail, e.g. `in 1m` or `30s ago`. */
  readonly label?: string;
  readonly variant?: BadgeVariant;
}

const STATE_TONE: Record<RetryState, BadgeTone> = {
  scheduled: 'info',
  retrying: 'info',
  failed: 'danger',
  exhausted: 'danger',
  succeeded: 'success',
};

/**
 * A compact pill for a node's retry budget: a rotate glyph, the `attempt /
 * maxAttempts` count, and an optional timing detail, toned by the retry `state`.
 * Reuses `Badge` for consistent pill chrome across scheduler and evidence rows.
 */
export function RetryChip({
  attempt,
  maxAttempts,
  state = 'scheduled',
  label,
  variant = 'soft',
  className,
  ...rest
}: RetryChipProps): ReactElement {
  return (
    <Badge
      className={['ui-retry-chip', className].filter(Boolean).join(' ')}
      data-retry-state={state}
      tone={STATE_TONE[state]}
      variant={variant}
      {...rest}
    >
      <Icon name="rotate-ccw" size={12} />
      <span className="ui-retry-chip__count">
        {attempt}/{maxAttempts}
      </span>
      {label ? <span className="ui-retry-chip__note">{label}</span> : null}
    </Badge>
  );
}

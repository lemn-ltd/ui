import type { HTMLAttributes, ReactElement } from 'react';
import { Badge, type BadgeTone, type BadgeVariant } from '../../primitives/index.js';
import './agent-status-badge.css';

export type AgentStatusBadgeStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'waiting'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface AgentStatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly status: AgentStatusBadgeStatus;
  readonly label?: string;
  readonly variant?: BadgeVariant;
}

const STATUS_TONE: Record<AgentStatusBadgeStatus, BadgeTone> = {
  idle: 'dim',
  queued: 'neutral',
  running: 'info',
  waiting: 'warn',
  completed: 'success',
  failed: 'danger',
  cancelled: 'dim',
};

const STATUS_LABEL: Record<AgentStatusBadgeStatus, string> = {
  idle: 'Idle',
  queued: 'Queued',
  running: 'Running',
  waiting: 'Waiting',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export function AgentStatusBadge({
  status,
  label = STATUS_LABEL[status],
  variant = 'soft',
  className,
  ...rest
}: AgentStatusBadgeProps): ReactElement {
  return (
    <Badge
      className={['ui-agent-status-badge', className].filter(Boolean).join(' ')}
      data-agent-status={status}
      showDot
      tone={STATUS_TONE[status]}
      variant={variant}
      {...rest}
    >
      {label}
    </Badge>
  );
}

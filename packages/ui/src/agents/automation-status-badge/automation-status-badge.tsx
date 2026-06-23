import type { HTMLAttributes, ReactElement } from 'react';
import { Badge, type BadgeTone, type BadgeVariant } from '../../primitives/index.js';
import './automation-status-badge.css';

/**
 * The automation lifecycle and run vocabulary: a definition moves through
 * `draft → published → archived`, while a single execution moves through
 * `queued → scheduled/due → running → waiting → completed/failed/cancelled`.
 */
export type AutomationStatus =
  | 'draft'
  | 'published'
  | 'archived'
  | 'queued'
  | 'scheduled'
  | 'due'
  | 'running'
  | 'waiting'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface AutomationStatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly status: AutomationStatus;
  /** Override the humanized label when a surface needs product-specific wording. */
  readonly label?: string;
  readonly variant?: BadgeVariant;
}

const STATUS_TONE: Record<AutomationStatus, BadgeTone> = {
  draft: 'warn',
  published: 'success',
  archived: 'dim',
  queued: 'neutral',
  scheduled: 'info',
  due: 'info',
  running: 'info',
  waiting: 'warn',
  completed: 'success',
  failed: 'danger',
  cancelled: 'dim',
};

const STATUS_LABEL: Record<AutomationStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
  queued: 'Queued',
  scheduled: 'Scheduled',
  due: 'Due',
  running: 'Running',
  waiting: 'Waiting',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

/**
 * A brand-neutral status pill for automation definition lifecycle and run
 * surfaces. A thin wrapper over `Badge` that maps the automation vocabulary to a
 * dotted tone and exposes a stable `data-automation-status` hook. For individual
 * graph node execution state use `NodeStateChip`; for agent execution use
 * `AgentStatusBadge`.
 */
export function AutomationStatusBadge({
  status,
  label = STATUS_LABEL[status],
  variant = 'soft',
  className,
  ...rest
}: AutomationStatusBadgeProps): ReactElement {
  return (
    <Badge
      className={['ui-automation-status-badge', className].filter(Boolean).join(' ')}
      data-automation-status={status}
      showDot
      tone={STATUS_TONE[status]}
      variant={variant}
      {...rest}
    >
      {label}
    </Badge>
  );
}

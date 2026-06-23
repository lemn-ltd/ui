import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { DescriptionList, DescriptionRow } from '../../data-display/index.js';
import { InfoBanner } from '../../feedback/index.js';
import { Field } from '../../forms/index.js';
import { Badge, type BadgeTone, Button, Textarea } from '../../primitives/index.js';
import './approval-panel.css';

/** The decision state of an automation human-task approval. */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'stale';

/**
 * A blocking condition surfaced before a decision: the graph changed since the
 * request, or the request itself went stale.
 */
export interface ApprovalConflict {
  readonly kind: 'graph-hash' | 'stale';
  readonly title: string;
  readonly description: ReactNode;
}

export interface ApprovalPanelMeta {
  readonly label: string;
  readonly value: ReactNode;
}

export interface ApprovalPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title: string;
  readonly status: ApprovalStatus;
  readonly meta?: readonly ApprovalPanelMeta[];

  /** A graph-hash or staleness conflict; when present, approval is blocked. */
  readonly conflict?: ApprovalConflict;

  readonly comment?: string;
  readonly onCommentChange?: (value: string) => void;
  readonly commentPlaceholder?: string;

  readonly onApprove?: () => void;
  readonly onReject?: () => void;
  readonly busy?: boolean;
  readonly approveLabel?: string;
  readonly rejectLabel?: string;
  /** Force-disable approval independent of conflict (e.g. missing permission). */
  readonly approveDisabled?: boolean;
}

const STATUS_TONE: Record<ApprovalStatus, BadgeTone> = {
  pending: 'warn',
  approved: 'success',
  rejected: 'danger',
  stale: 'dim',
};

const STATUS_LABEL: Record<ApprovalStatus, string> = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  stale: 'stale',
};

/**
 * The decision surface for an automation human-task node. It shows the request
 * title and status, the automation/run/requester/graph-hash context, an
 * optional comment, and Approve/Reject actions. A graph-hash or stale-approval
 * conflict renders a warning and blocks approval until the host re-validates.
 * Presentational — every decision is emitted through the callbacks.
 */
export function ApprovalPanel({
  title,
  status,
  meta = [],
  conflict,
  comment,
  onCommentChange,
  commentPlaceholder = 'Add an approval note…',
  onApprove,
  onReject,
  busy = false,
  approveLabel = 'Approve',
  rejectLabel = 'Reject',
  approveDisabled,
  className,
  ...rest
}: ApprovalPanelProps): ReactElement {
  const blockApprove = busy || approveDisabled === true || Boolean(conflict);

  return (
    <div
      className={['ui-approval-panel', className].filter(Boolean).join(' ')}
      data-status={status}
      {...rest}
    >
      <div className="ui-approval-panel__header">
        <h3 className="ui-approval-panel__title">{title}</h3>
        <Badge showDot tone={STATUS_TONE[status]} variant="soft">
          {STATUS_LABEL[status]}
        </Badge>
      </div>

      {meta.length > 0 ? (
        <DescriptionList className="ui-approval-panel__meta">
          {meta.map((row) => (
            <DescriptionRow key={row.label} label={row.label}>
              {row.value}
            </DescriptionRow>
          ))}
        </DescriptionList>
      ) : null}

      {conflict ? (
        <InfoBanner variant="warn">
          <strong className="ui-approval-panel__conflict-title">{conflict.title}</strong>
          <p className="ui-approval-panel__conflict-body">{conflict.description}</p>
        </InfoBanner>
      ) : null}

      <Field label="Comment">
        {(control) => (
          <Textarea
            {...control}
            onChange={(event) => onCommentChange?.(event.target.value)}
            placeholder={commentPlaceholder}
            rows={2}
            value={comment ?? ''}
          />
        )}
      </Field>

      <div className="ui-approval-panel__actions">
        <Button disabled={busy} onClick={onReject} variant="ghost-danger">
          {rejectLabel}
        </Button>
        <Button disabled={blockApprove} onClick={onApprove} variant="primary">
          {approveLabel}
        </Button>
      </div>
    </div>
  );
}

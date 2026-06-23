import type { HTMLAttributes, ReactElement } from 'react';
import { EmptyState } from '../../data-display/empty-state/empty-state.js';
import { ApprovalCard, type ApprovalRequest } from '../approval-card/approval-card.js';
import './approvals-inbox.css';

export interface ApprovalsInboxProps extends HTMLAttributes<HTMLDivElement> {
  readonly requests: readonly ApprovalRequest[];
  readonly onApprove: (hitlRequestId: string) => void;
  readonly onReject: (hitlRequestId: string) => void;
  readonly onChoose?: (hitlRequestId: string, choiceId: string) => void;
  /** Message shown when there are no pending requests. */
  readonly emptyHint?: string;
}

const DEFAULT_EMPTY_HINT = 'No pending approvals';

/**
 * A vertical queue of pending HITL requests, each rendered as an `ApprovalCard`.
 * Shows a count header when at least one request is pending and an `EmptyState`
 * otherwise. Presentational — every decision is forwarded to the inbox
 * callbacks, which pass straight through to each card.
 */
export function ApprovalsInbox({
  requests,
  onApprove,
  onReject,
  onChoose,
  emptyHint,
  className,
  ...rest
}: ApprovalsInboxProps): ReactElement {
  const count = requests.length;

  return (
    <div
      className={['ui-approvals-inbox', className].filter(Boolean).join(' ')}
      data-empty={count === 0 ? 'true' : 'false'}
      {...rest}
    >
      {count === 0 ? (
        <EmptyState
          description={emptyHint ?? DEFAULT_EMPTY_HINT}
          icon="check-circle"
          intent="no-results"
          title="Inbox clear"
        />
      ) : (
        <>
          <div className="ui-approvals-inbox__header">
            <span className="ui-approvals-inbox__count">
              {count} pending {count === 1 ? 'approval' : 'approvals'}
            </span>
          </div>
          <ul className="ui-approvals-inbox__list">
            {requests.map((request) => (
              <li className="ui-approvals-inbox__item" key={request.hitlRequestId}>
                <ApprovalCard
                  onApprove={onApprove}
                  onChoose={onChoose}
                  onReject={onReject}
                  request={request}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

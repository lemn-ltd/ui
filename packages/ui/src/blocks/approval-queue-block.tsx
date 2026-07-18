import type { ReactElement, ReactNode } from 'react';
import { ApprovalCard, type ApprovalRequest } from '../agents/approval-card/approval-card.js';
import { EmptyState } from '../data-display/empty-state/empty-state.js';
import { Alert } from '../feedback/alert/alert.js';
import { Skeleton } from '../feedback/skeleton/skeleton.js';
import './blocks.css';
import './approval-queue-block.css';

export interface ApprovalQueueBlockProps {
  readonly busyIds?: ReadonlySet<string>;
  readonly error?: string;
  readonly loading?: boolean;
  readonly onApprove: (id: string) => void;
  readonly onChoose?: (id: string, choiceId: string) => void;
  readonly onReject: (id: string) => void;
  readonly requests: readonly ApprovalRequest[];
  readonly title?: ReactNode;
}

/** Curated bounded queue for human-in-the-loop decisions. */
export function ApprovalQueueBlock({
  busyIds = new Set(),
  error,
  loading = false,
  onApprove,
  onChoose,
  onReject,
  requests,
  title = 'Approval queue',
}: ApprovalQueueBlockProps): ReactElement {
  return (
    <section aria-busy={loading || undefined} className="ui-block ui-approval-queue-block">
      <header className="ui-block__header"><h2>{title}</h2></header>
      {error ? <Alert message={error} title="Approvals unavailable" variant="error" /> : null}
      {loading ? (
        <div aria-label="Loading approvals" className="ui-approval-queue-block__list">
          {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} shape="rect" />)}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState description="New requests will appear here." icon="check" title="Nothing needs approval" />
      ) : (
        <div className="ui-approval-queue-block__list">
          {requests.map((request) => (
            <ApprovalCard
              busy={busyIds.has(request.hitlRequestId)}
              key={request.hitlRequestId}
              onApprove={onApprove}
              onChoose={onChoose}
              onReject={onReject}
              request={request}
            />
          ))}
        </div>
      )}
    </section>
  );
}

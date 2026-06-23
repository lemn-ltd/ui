import type { HTMLAttributes, ReactElement } from 'react';
import { Card } from '../../data-display/card/card.js';
import { RelativeTime } from '../../data-display/relative-time/relative-time.js';
import { Button } from '../../primitives/button/button.js';
import { CapabilityChip } from '../capability-chip/capability-chip.js';
import './approval-card.css';

/** Interaction shape a pending HITL request expects from the operator. */
export type HitlMode = 'text' | 'choice' | 'confirmation';

/** Whether the runtime is requesting raw input or an explicit approval gate. */
export type HitlKind = 'input_request' | 'approval';

/** A selectable option for a `choice`-mode request. */
export interface HitlChoice {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
}

/** Risk ceiling levels, mirrored from the capability safety contract. */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** A single pending human-in-the-loop request the operator must resolve. */
export interface ApprovalRequest {
  readonly hitlRequestId: string;
  readonly kind: HitlKind;
  readonly mode: HitlMode;

  readonly prompt: string;
  readonly choices?: readonly HitlChoice[];

  readonly capabilityRef?: string;
  readonly integrationName?: string;
  readonly risk?: RiskLevel;

  readonly requestedAt?: string;
}

export interface ApprovalCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly request: ApprovalRequest;
  readonly onApprove: (hitlRequestId: string) => void;
  readonly onReject: (hitlRequestId: string) => void;
  readonly onChoose?: (hitlRequestId: string, choiceId: string) => void;
  /** Disables every action while a decision is in flight. */
  readonly busy?: boolean;
}

/**
 * A single pending HITL request rendered as a decision surface. Composes `Card`
 * with `CapabilityChip` (risk lens), `Button` actions, and `RelativeTime`. The
 * body shape follows the request mode: `confirmation` shows Approve/Reject,
 * `choice` shows one button per option plus Reject, and `text` notes that
 * structured input is required out-of-band. Purely presentational — all
 * decisions are emitted through the callbacks.
 */
export function ApprovalCard({
  request,
  onApprove,
  onReject,
  onChoose,
  busy = false,
  className,
  ...rest
}: ApprovalCardProps): ReactElement {
  const {
    hitlRequestId,
    mode,
    prompt,
    choices,
    capabilityRef,
    integrationName,
    risk,
    requestedAt,
  } = request;

  const header = (
    <div className="ui-approval-card__header">
      <p className="ui-approval-card__prompt">{prompt}</p>
      {capabilityRef || integrationName || risk ? (
        <div className="ui-approval-card__meta">
          {capabilityRef ? <span className="ui-approval-card__ref">{capabilityRef}</span> : null}
          {integrationName ? (
            <span className="ui-approval-card__integration">{integrationName}</span>
          ) : null}
          {risk ? <CapabilityChip kind="risk" value={risk} /> : null}
        </div>
      ) : null}
    </div>
  );

  const footer = requestedAt ? (
    <div className="ui-approval-card__footer">
      <span className="ui-approval-card__requested">
        Requested <RelativeTime value={requestedAt} />
      </span>
    </div>
  ) : undefined;

  return (
    <Card
      className={['ui-approval-card', className].filter(Boolean).join(' ')}
      data-mode={mode}
      data-busy={busy ? 'true' : 'false'}
      footer={footer}
      title={header}
      {...rest}
    >
      <div className="ui-approval-card__body">
        {mode === 'confirmation' ? (
          <div className="ui-approval-card__actions">
            <Button disabled={busy} onClick={() => onApprove(hitlRequestId)} variant="primary">
              Approve
            </Button>
            <Button disabled={busy} onClick={() => onReject(hitlRequestId)} variant="ghost-danger">
              Reject
            </Button>
          </div>
        ) : null}

        {mode === 'choice' ? (
          <div className="ui-approval-card__actions ui-approval-card__actions--choices">
            {(choices ?? []).map((choice) => (
              <Button
                disabled={busy}
                key={choice.id}
                onClick={() => onChoose?.(hitlRequestId, choice.id)}
                title={choice.description}
                variant="outline"
              >
                {choice.label}
              </Button>
            ))}
            <Button disabled={busy} onClick={() => onReject(hitlRequestId)} variant="ghost-danger">
              Reject
            </Button>
          </div>
        ) : null}

        {mode === 'text' ? (
          <p className="ui-approval-card__note">
            This request needs typed input. Respond from the conversation to provide it.
          </p>
        ) : null}
      </div>
    </Card>
  );
}

import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { EmptyState } from '../../data-display/index.js';
import { InfoBanner, type InfoBannerVariant } from '../../feedback/index.js';
import { Button } from '../../primitives/index.js';
import type { GraphNodeKind } from '../graph-node/graph-node.js';
import './proposal-preview.css';

export interface ProposalNode {
  readonly kind: GraphNodeKind;
  /** The proposed node's name or detail, e.g. `pull_request` or `is_urgent == true`. */
  readonly label: string;
}

export type CompileStatus = 'pending' | 'success' | 'error';

export interface ProposalCompile {
  readonly status: CompileStatus;
  readonly message: ReactNode;
}

export interface ProposalPreviewProps extends HTMLAttributes<HTMLDivElement> {
  readonly nodes: readonly ProposalNode[];
  readonly compile?: ProposalCompile;

  readonly onAccept?: () => void;
  readonly onReject?: () => void;
  readonly busy?: boolean;
  readonly acceptLabel?: string;
  readonly rejectLabel?: string;

  readonly title?: string;
  readonly emptyHint?: string;
}

const COMPILE_VARIANT: Record<CompileStatus, InfoBannerVariant> = {
  pending: 'info',
  success: 'success',
  error: 'danger',
};

/**
 * The review surface for a generated automation graph: a monospace preview of
 * the proposed nodes, a compile-result banner, and Accept/Reject actions.
 * Accept is blocked until the proposal compiles cleanly. Presentational — the
 * decision is emitted through the callbacks.
 */
export function ProposalPreview({
  nodes,
  compile,
  onAccept,
  onReject,
  busy = false,
  acceptLabel = 'Accept proposal',
  rejectLabel = 'Reject proposal',
  title = 'Generated graph (preview)',
  emptyHint = 'Generate a proposal to preview the planned graph.',
  className,
  ...rest
}: ProposalPreviewProps): ReactElement {
  const isEmpty = nodes.length === 0;
  const acceptBlocked = busy || !compile || compile.status !== 'success';

  return (
    <div className={['ui-proposal-preview', className].filter(Boolean).join(' ')} {...rest}>
      <p className="ui-proposal-preview__title">{title}</p>

      {isEmpty ? (
        <EmptyState description={emptyHint} icon="layout-grid" title="No proposal yet" />
      ) : (
        <>
          <div className="ui-proposal-preview__graph">
            {nodes.map((node) => (
              <div className="ui-proposal-preview__line" key={`${node.kind}:${node.label}`}>
                <span aria-hidden="true" className="ui-proposal-preview__dot" />
                <code className="ui-proposal-preview__node">
                  <span className="ui-proposal-preview__kind">{node.kind}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{node.label}</span>
                </code>
              </div>
            ))}
          </div>

          {compile ? (
            <InfoBanner variant={COMPILE_VARIANT[compile.status]}>{compile.message}</InfoBanner>
          ) : null}

          <div className="ui-proposal-preview__actions">
            <Button disabled={busy} onClick={onReject} variant="ghost-danger">
              {rejectLabel}
            </Button>
            <Button disabled={acceptBlocked} onClick={onAccept} variant="primary">
              {acceptLabel}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

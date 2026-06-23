import { Panel } from '@xyflow/react';
import type { ReactElement, ReactNode } from 'react';
import { Tooltip } from '../../overlays/index.js';
import { Icon } from '../../primitives/index.js';

export function ExecutionMapHeader({
  subtitle,
  title,
}: {
  readonly subtitle?: ReactNode;
  readonly title?: ReactNode;
}): ReactElement | null {
  if (!title && !subtitle) return null;
  return (
    <header className="ui-execution-map__header">
      <div>
        {subtitle ? <p>{subtitle}</p> : null}
        {title ? <h2>{title}</h2> : null}
      </div>
    </header>
  );
}

export function ExecutionMapRefreshPanel({
  onRefresh,
  refreshing,
  refreshLabel,
}: {
  readonly onRefresh?: () => void;
  readonly refreshing: boolean;
  readonly refreshLabel: string;
}): ReactElement | null {
  if (!onRefresh) return null;
  return (
    <Panel className="ui-execution-map__canvas-actions-panel" position="top-right">
      <RefreshGraphAction
        label={refreshing ? 'Refreshing graph' : refreshLabel}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </Panel>
  );
}

function RefreshGraphAction({
  label,
  refreshing,
  onRefresh,
}: {
  readonly label: string;
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
}) {
  return (
    <Tooltip
      content={refreshing ? 'Graph refresh is already running.' : 'Refresh the execution graph.'}
      placement="left"
    >
      <button
        aria-disabled={refreshing}
        aria-label={label}
        className="ui-execution-map__viewport-button ui-execution-map__refresh-action"
        data-refreshing={refreshing ? 'true' : 'false'}
        type="button"
        onClick={() => {
          if (!refreshing) onRefresh();
        }}
      >
        <Icon name="refresh" size={18} />
      </button>
    </Tooltip>
  );
}

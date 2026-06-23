import { CircleCheck } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Button } from '../../primitives/index.js';

export interface BulkActionsBarProps {
  readonly count: number;
  readonly actions?: ReactNode;
  readonly onClear: () => void;
  readonly clearLabel?: ReactNode;
}

/** Selection summary bar shown above the table while one or more rows are selected. */
export function BulkActionsBar({
  count,
  actions,
  onClear,
  clearLabel = 'Clear',
}: BulkActionsBarProps): ReactElement {
  return (
    <div className="ui-data-table__bulk">
      <span className="ui-data-table__bulk-selected">
        <CircleCheck
          aria-hidden="true"
          className="ui-icon ui-data-table__bulk-check"
          height={16}
          width={16}
        />
        <span className="ui-data-table__bulk-count">{count} selected</span>
      </span>
      <div className="ui-data-table__bulk-actions">
        {actions}
        <Button className="ui-data-table__bulk-clear" onClick={onClear} variant="ghost">
          {clearLabel}
        </Button>
      </div>
    </div>
  );
}

import type { ReactElement } from 'react';
import { DataTable, type DataTableColumn, EmptyState } from '../../data-display/index.js';
import { type NodeState, NodeStateChip } from '../node-state-chip/node-state-chip.js';
import './node-attempts-table.css';

export interface NodeAttempt {
  readonly node: string;
  readonly type: string;
  readonly attempt: number;
  readonly state: NodeState;
  readonly duration?: string;
  readonly error?: string;
}

export interface NodeAttemptsTableProps {
  readonly attempts: readonly NodeAttempt[];
  readonly emptyHint?: string;
  readonly className?: string;
}

const PLACEHOLDER = '—';

const COLUMNS: readonly DataTableColumn<NodeAttempt>[] = [
  {
    key: 'node',
    header: 'Node',
    width: 160,
    render: (row) => <code className="ui-node-attempts-table__mono">{row.node}</code>,
    sortValue: (row) => row.node,
    sortable: true,
  },
  {
    key: 'type',
    header: 'Type',
    width: 130,
    render: (row) => <span className="ui-node-attempts-table__muted">{row.type}</span>,
    sortValue: (row) => row.type,
    sortable: true,
  },
  {
    key: 'attempt',
    header: 'Attempt',
    width: 90,
    align: 'end',
    render: (row) => <span className="ui-node-attempts-table__muted">{row.attempt}</span>,
    sortValue: (row) => row.attempt,
    sortable: true,
  },
  {
    key: 'state',
    header: 'Status',
    width: 140,
    render: (row) => <NodeStateChip state={row.state} />,
  },
  {
    key: 'duration',
    header: 'Duration',
    width: 100,
    render: (row) => (
      <span className="ui-node-attempts-table__muted">{row.duration ?? PLACEHOLDER}</span>
    ),
  },
  {
    key: 'error',
    header: 'Error',
    width: 220,
    render: (row) => (
      <span className="ui-node-attempts-table__muted">{row.error ?? PLACEHOLDER}</span>
    ),
  },
];

const attemptKey = (row: NodeAttempt): string => `${row.node}#${row.attempt}`;

/**
 * The per-node attempt ledger for an automation run: node, type, attempt count,
 * execution state, duration, and error. Composes the canonical `DataTable`
 * (sortable, presentational) and renders each state through `NodeStateChip`. An
 * empty ledger falls back to a first-run empty state.
 */
export function NodeAttemptsTable({
  attempts,
  emptyHint = 'Node attempts will appear once the run executes.',
  className,
}: NodeAttemptsTableProps): ReactElement {
  if (attempts.length === 0) {
    return (
      <div className={['ui-node-attempts-table', className].filter(Boolean).join(' ')}>
        <EmptyState description={emptyHint} icon="list" title="No attempts yet" />
      </div>
    );
  }

  return (
    <DataTable
      className={['ui-node-attempts-table', className].filter(Boolean).join(' ')}
      columns={COLUMNS}
      rowKey={attemptKey}
      rows={attempts}
    />
  );
}

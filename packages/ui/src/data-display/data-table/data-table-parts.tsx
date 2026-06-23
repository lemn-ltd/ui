import type { ReactElement, ReactNode } from 'react';
import { Skeleton } from '../../feedback/index.js';
import { SegmentedControl } from '../../forms/index.js';
import { Pagination } from '../../navigation/index.js';
import { Checkbox } from '../../primitives/index.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { BulkActionsBar } from './bulk-actions-bar.js';
import { ColumnToggle } from './column-toggle.js';
import type { DataTableColumn, DataTableDensity } from './data-table-types.js';
import { SortableHeaderCell, type SortDirection } from './sortable-header-cell.js';

const SKELETON_ROW_COUNT = 6;

export function DataTableToolbar<TRow>({
  effectiveDensity,
  effectiveHidden,
  hasToolbar,
  hideableColumns,
  setDensity,
  showColumnsMenu,
  toggleColumn,
}: {
  readonly effectiveDensity: DataTableDensity;
  readonly effectiveHidden: ReadonlySet<string>;
  readonly hasToolbar: boolean;
  readonly hideableColumns: readonly DataTableColumn<TRow>[];
  readonly setDensity: (value: DataTableDensity) => void;
  readonly showColumnsMenu: boolean;
  readonly toggleColumn: (key: string) => void;
}): ReactElement | null {
  if (!hasToolbar) return null;
  return (
    <div className="ui-data-table__toolbar">
      <SegmentedControl
        aria-label="Row density"
        onValueChange={(value) => setDensity(value as DataTableDensity)}
        segments={[
          { value: 'comfortable', label: 'Comfortable' },
          { value: 'compact', label: 'Compact' },
        ]}
        value={effectiveDensity}
      />
      {showColumnsMenu ? (
        <ColumnToggle
          columns={hideableColumns.map((column) => ({
            hidden: effectiveHidden.has(column.key),
            key: column.key,
            label: column.header,
          }))}
          onToggle={toggleColumn}
        />
      ) : null}
    </div>
  );
}

export function DataTableBulkActions({
  allKeys,
  bulkActions,
  effectiveSelected,
  emitSelection,
  selectable,
  selectedCount,
}: {
  readonly allKeys: readonly string[];
  readonly bulkActions?: (selectedKeys: readonly string[]) => ReactNode;
  readonly effectiveSelected: ReadonlySet<string>;
  readonly emitSelection: (next: ReadonlySet<string>) => void;
  readonly selectable: boolean;
  readonly selectedCount: number;
}): ReactElement | null {
  if (!selectable || selectedCount === 0) return null;
  return (
    <BulkActionsBar
      actions={bulkActions?.(allKeys.filter((key) => effectiveSelected.has(key)))}
      count={selectedCount}
      onClear={() => emitSelection(new Set())}
    />
  );
}

export function DataTableHead<TRow>({
  effectiveSortDirection,
  effectiveSortKey,
  handleSort,
  headerChecked,
  headRowRef,
  rowActions,
  selectable,
  toggleAll,
  visibleColumns,
}: {
  readonly effectiveSortDirection: SortDirection;
  readonly effectiveSortKey: string | null;
  readonly handleSort: (key: string) => void;
  readonly headerChecked: boolean | 'indeterminate';
  readonly headRowRef: React.RefObject<HTMLTableRowElement | null>;
  readonly rowActions?: (row: TRow) => ReactNode;
  readonly selectable: boolean;
  readonly toggleAll: () => void;
  readonly visibleColumns: readonly DataTableColumn<TRow>[];
}): ReactElement {
  return (
    <thead className="ui-data-table__head">
      <tr ref={headRowRef}>
        {selectable ? (
          <th className="ui-data-table__th ui-data-table__th--select" scope="col">
            <Checkbox
              aria-label="Select all rows"
              checked={headerChecked}
              onCheckedChange={toggleAll}
            />
          </th>
        ) : null}
        {visibleColumns.map((column) => (
          <DataTableHeaderCell
            column={column}
            effectiveSortDirection={effectiveSortDirection}
            effectiveSortKey={effectiveSortKey}
            handleSort={handleSort}
            key={column.key}
          />
        ))}
        {rowActions ? (
          <th className="ui-data-table__th ui-data-table__th--actions" scope="col" />
        ) : null}
      </tr>
    </thead>
  );
}

export function DataTableHeaderCell<TRow>({
  column,
  effectiveSortDirection,
  effectiveSortKey,
  handleSort,
}: {
  readonly column: DataTableColumn<TRow>;
  readonly effectiveSortDirection: SortDirection;
  readonly effectiveSortKey: string | null;
  readonly handleSort: (key: string) => void;
}): ReactElement {
  if (column.sortable) {
    return (
      <SortableHeaderCell
        align={column.align}
        onSort={() => handleSort(column.key)}
        sort={effectiveSortKey === column.key ? effectiveSortDirection : 'unsorted'}
      >
        {column.header}
      </SortableHeaderCell>
    );
  }
  return (
    <th className="ui-data-table__th" data-align={column.align} scope="col">
      {column.header}
    </th>
  );
}

export function DataTableBody<TRow>({
  colSpan,
  effectiveSelected,
  isEmpty,
  loading,
  onClearFilters,
  onRowClick,
  pageRows,
  rowActions,
  rowKey,
  selectable,
  stop,
  toggleRow,
  visibleColumns,
}: {
  readonly colSpan: number;
  readonly effectiveSelected: ReadonlySet<string>;
  readonly isEmpty: boolean;
  readonly loading: boolean;
  readonly onClearFilters?: () => void;
  readonly onRowClick?: (row: TRow) => void;
  readonly pageRows: readonly TRow[];
  readonly rowActions?: (row: TRow) => ReactNode;
  readonly rowKey: (row: TRow) => string;
  readonly selectable: boolean;
  readonly stop: (event: { stopPropagation: () => void }) => void;
  readonly toggleRow: (key: string) => void;
  readonly visibleColumns: readonly DataTableColumn<TRow>[];
}): ReactElement {
  return (
    <tbody>
      {loading ? (
        <DataTableSkeletonRows
          rowActions={rowActions}
          selectable={selectable}
          visibleColumns={visibleColumns}
        />
      ) : isEmpty ? (
        <DataTableEmptyRow colSpan={colSpan} onClearFilters={onClearFilters} />
      ) : (
        pageRows.map((row) => {
          const key = rowKey(row);
          return (
            <DataTableBodyRow
              columns={visibleColumns}
              key={key}
              onRowClick={onRowClick}
              row={row}
              rowActions={rowActions}
              rowKey={() => key}
              rowSelected={effectiveSelected.has(key)}
              selectable={selectable}
              stop={stop}
              toggleRow={toggleRow}
            />
          );
        })
      )}
    </tbody>
  );
}

function DataTableSkeletonRows<TRow>({
  rowActions,
  selectable,
  visibleColumns,
}: {
  readonly rowActions?: (row: TRow) => ReactNode;
  readonly selectable: boolean;
  readonly visibleColumns: readonly DataTableColumn<TRow>[];
}): ReactElement {
  return (
    <>
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
        <tr className="ui-data-table__row" key={`skeleton-${index}`}>
          {selectable ? (
            <td className="ui-data-table__td ui-data-table__td--select">
              <Skeleton shape="line" />
            </td>
          ) : null}
          {visibleColumns.map((column) => (
            <td className="ui-data-table__td" data-align={column.align} key={column.key}>
              <Skeleton shape="line" />
            </td>
          ))}
          {rowActions ? <td className="ui-data-table__td ui-data-table__td--actions" /> : null}
        </tr>
      ))}
    </>
  );
}

function DataTableEmptyRow({
  colSpan,
  onClearFilters,
}: {
  readonly colSpan: number;
  readonly onClearFilters?: () => void;
}): ReactElement {
  return (
    <tr>
      <td className="ui-data-table__empty" colSpan={colSpan}>
        <EmptyState intent="no-results" onClearFilters={onClearFilters} />
      </td>
    </tr>
  );
}

export function DataTableFooter({
  clampedPage,
  goToPage,
  isEmpty,
  loading,
  pageCount,
  pageSize,
  total,
}: {
  readonly clampedPage: number;
  readonly goToPage: (next: number) => void;
  readonly isEmpty: boolean;
  readonly loading: boolean;
  readonly pageCount: number;
  readonly pageSize: number;
  readonly total: number;
}): ReactElement | null {
  if (isEmpty || loading || pageCount <= 1) return null;
  return (
    <div className="ui-data-table__footer">
      <Pagination
        onPageChange={(next) => goToPage(next - 1)}
        page={clampedPage + 1}
        pageSize={pageSize}
        total={total}
      />
    </div>
  );
}

export function DataTableBodyRow<TRow>({
  columns,
  onRowClick,
  row,
  rowActions,
  rowKey,
  rowSelected,
  selectable,
  stop,
  toggleRow,
}: {
  readonly columns: readonly DataTableColumn<TRow>[];
  readonly onRowClick?: (row: TRow) => void;
  readonly row: TRow;
  readonly rowActions?: (row: TRow) => ReactNode;
  readonly rowKey: (row: TRow) => string;
  readonly rowSelected: boolean;
  readonly selectable: boolean;
  readonly stop: (event: { stopPropagation: () => void }) => void;
  readonly toggleRow: (key: string) => void;
}): ReactElement {
  const key = rowKey(row);
  return (
    <tr
      className="ui-data-table__row"
      data-clickable={onRowClick ? 'true' : undefined}
      data-selected={rowSelected ? 'true' : 'false'}
      onClick={onRowClick ? () => onRowClick(row) : undefined}
      onKeyDown={onRowClick ? (event) => activateRowOnEnter(event.key, row, onRowClick) : undefined}
      tabIndex={onRowClick ? 0 : undefined}
    >
      {selectable ? (
        <td className="ui-data-table__td ui-data-table__td--select" onClick={stop} onKeyDown={stop}>
          <Checkbox
            aria-label="Select row"
            checked={rowSelected}
            onCheckedChange={() => toggleRow(key)}
          />
        </td>
      ) : null}
      {columns.map((column) => (
        <td className="ui-data-table__td" data-align={column.align} key={column.key}>
          {column.render(row)}
        </td>
      ))}
      {rowActions ? (
        <td
          className="ui-data-table__td ui-data-table__td--actions"
          onClick={stop}
          onKeyDown={stop}
        >
          {rowActions(row)}
        </td>
      ) : null}
    </tr>
  );
}

function activateRowOnEnter<TRow>(key: string, row: TRow, onRowClick: (row: TRow) => void): void {
  if (key === 'Enter') onRowClick(row);
}

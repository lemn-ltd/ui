import type { ReactElement } from 'react';
import {
  DataTableBody,
  DataTableBulkActions,
  DataTableFooter,
  DataTableHead,
  DataTableToolbar,
} from './data-table-parts.js';
import { useDataTableState } from './data-table-state.js';

export type {
  DataTableColumn,
  DataTableDensity,
  DataTableProps,
  DataTableSort,
} from './data-table-types.js';

import type { DataTableProps } from './data-table-types.js';
import './data-table.css';

/**
 * Prop-driven table. Sort, selection, pagination, column visibility and density each default to
 * internal (uncontrolled) state and switch to controlled when the matching prop is supplied — so
 * the same component serves an in-memory list and a server-paged/sorted dataset. Callers supply
 * `rows`/`columns`; the filtered-empty surface reuses the shared `no-results` `EmptyState`.
 */
export function DataTable<TRow>(props: DataTableProps<TRow>): ReactElement {
  const { bulkActions, className, onClearFilters, onRowClick, rowActions, rowKey } = props;
  const state = useDataTableState(props);

  return (
    <div
      className={['ui-data-table', className].filter(Boolean).join(' ')}
      data-density={state.effectiveDensity}
    >
      <DataTableToolbar
        effectiveDensity={state.effectiveDensity}
        effectiveHidden={state.effectiveHidden}
        hasToolbar={state.hasToolbar}
        hideableColumns={state.hideableColumns}
        setDensity={state.setDensity}
        showColumnsMenu={state.showColumnsMenu}
        toggleColumn={state.toggleColumn}
      />

      <DataTableBulkActions
        allKeys={state.allKeys}
        bulkActions={bulkActions}
        effectiveSelected={state.effectiveSelected}
        emitSelection={state.emitSelection}
        selectable={state.selectable}
        selectedCount={state.selectedCount}
      />

      <div className="ui-data-table__scroll">
        <table
          className="ui-data-table__table"
          style={state.freezeWidths ? { tableLayout: 'fixed' } : undefined}
        >
          <colgroup>
            {state.colDefs.map((col, index) => (
              <col
                className={col.className}
                key={col.key}
                style={
                  state.freezeWidths
                    ? { width: `${state.frozenWidths.current[index]}px` }
                    : col.style
                }
              />
            ))}
          </colgroup>
          <DataTableHead
            effectiveSortDirection={state.effectiveSortDirection}
            effectiveSortKey={state.effectiveSortKey}
            handleSort={state.handleSort}
            headerChecked={state.headerChecked}
            headRowRef={state.headRowRef}
            rowActions={rowActions}
            selectable={state.selectable}
            toggleAll={state.toggleAll}
            visibleColumns={state.visibleColumns}
          />
          <DataTableBody
            colSpan={state.colSpan}
            effectiveSelected={state.effectiveSelected}
            isEmpty={state.isEmpty}
            loading={state.loading}
            onClearFilters={onClearFilters}
            onRowClick={onRowClick}
            pageRows={state.pageRows}
            rowActions={rowActions}
            rowKey={rowKey}
            selectable={state.selectable}
            stop={state.stop}
            toggleRow={state.toggleRow}
            visibleColumns={state.visibleColumns}
          />
        </table>
      </div>

      <DataTableFooter
        clampedPage={state.clampedPage}
        goToPage={state.goToPage}
        isEmpty={state.isEmpty}
        loading={state.loading}
        pageCount={state.pageCount}
        pageSize={state.pageSize}
        total={state.total}
      />
    </div>
  );
}

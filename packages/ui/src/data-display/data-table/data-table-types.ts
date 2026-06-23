import type { CSSProperties, ReactNode, RefObject } from 'react';
import type { ColumnAlign, SortDirection } from './sortable-header-cell.js';

export type DataTableDensity = 'comfortable' | 'compact';

export interface DataTableSort {
  readonly key: string;
  readonly direction: 'asc' | 'desc';
}

export interface DataTableColumn<TRow> {
  readonly key: string;
  readonly header: ReactNode;
  readonly sortable?: boolean;
  readonly render: (row: TRow) => ReactNode;
  readonly sortValue?: (row: TRow) => string | number;

  readonly align?: ColumnAlign;
  readonly width?: number;
  readonly minWidth?: number;
  readonly hideable?: boolean;
}

export interface DataTableProps<TRow> {
  readonly columns: readonly DataTableColumn<TRow>[];
  readonly rows: readonly TRow[];
  readonly rowKey: (row: TRow) => string;
  readonly pageSize?: number;
  readonly selectable?: boolean;
  readonly bulkActions?: (selectedKeys: readonly string[]) => ReactNode;
  readonly onClearFilters?: () => void;
  readonly className?: string;

  readonly onRowClick?: (row: TRow) => void;
  readonly rowActions?: (row: TRow) => ReactNode;
  readonly loading?: boolean;

  readonly density?: DataTableDensity;
  readonly defaultDensity?: DataTableDensity;
  readonly onDensityChange?: (density: DataTableDensity) => void;

  readonly hiddenKeys?: readonly string[];
  readonly defaultHiddenKeys?: readonly string[];
  readonly onHiddenKeysChange?: (keys: readonly string[]) => void;

  readonly selectedKeys?: readonly string[];
  readonly onSelectionChange?: (keys: readonly string[]) => void;

  readonly sort?: DataTableSort | null;
  readonly onSortChange?: (sort: DataTableSort | null) => void;

  /** Zero-based current page. When set, the table renders `rows` as-is (server-side paging). */
  readonly page?: number;
  readonly onPageChange?: (page: number) => void;
  /** Total row count across all pages; defaults to the in-memory row count. */
  readonly totalCount?: number;
}

export interface DataTableState<TRow> {
  readonly effectiveSortKey: string | null;
  readonly effectiveSortDirection: SortDirection;
  readonly effectiveSelected: ReadonlySet<string>;
  readonly effectiveHidden: ReadonlySet<string>;
  readonly effectiveDensity: DataTableDensity;
  readonly visibleColumns: readonly DataTableColumn<TRow>[];
  readonly hideableColumns: readonly DataTableColumn<TRow>[];
  readonly pageRows: readonly TRow[];
  readonly total: number;
  readonly pageCount: number;
  readonly clampedPage: number;
  readonly pageSize: number;
  readonly selectable: boolean;
  readonly loading: boolean;
  readonly allKeys: readonly string[];
  readonly selectedCount: number;
  readonly headerChecked: boolean | 'indeterminate';
  readonly colSpan: number;
  readonly isEmpty: boolean;
  readonly showColumnsMenu: boolean;
  readonly hasToolbar: boolean;
  readonly headRowRef: RefObject<HTMLTableRowElement | null>;
  readonly frozenWidths: RefObject<number[]>;
  readonly freezeWidths: boolean;
  readonly colDefs: readonly DataTableColDef[];
  readonly goToPage: (next: number) => void;
  readonly handleSort: (key: string) => void;
  readonly emitSelection: (next: ReadonlySet<string>) => void;
  readonly toggleAll: () => void;
  readonly toggleRow: (key: string) => void;
  readonly toggleColumn: (key: string) => void;
  readonly setDensity: (value: DataTableDensity) => void;
  readonly stop: (event: { stopPropagation: () => void }) => void;
}

export interface DataTableColDef {
  readonly key: string;
  readonly className?: string;
  readonly style?: CSSProperties;
}

export interface SortState {
  readonly key: string | null;
  readonly direction: SortDirection;
}

export interface PageState<TRow> {
  readonly total: number;
  readonly pageCount: number;
  readonly clampedPage: number;
  readonly pageRows: readonly TRow[];
}

export interface SelectionState {
  readonly allKeys: readonly string[];
  readonly selectedCount: number;
  readonly allSelected: boolean;
  readonly headerChecked: boolean | 'indeterminate';
}

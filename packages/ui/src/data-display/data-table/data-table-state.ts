import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  DataTableColDef,
  DataTableColumn,
  DataTableDensity,
  DataTableProps,
  DataTableSort,
  DataTableState,
  PageState,
  SelectionState,
  SortState,
} from './data-table-types.js';
import type { SortDirection } from './sortable-header-cell.js';

function nextDirection(current: SortDirection): SortDirection {
  if (current === 'unsorted') return 'asc';
  if (current === 'asc') return 'desc';
  return 'unsorted';
}

function colStyle<TRow>(column: DataTableColumn<TRow>): CSSProperties | undefined {
  if (column.width === undefined && column.minWidth === undefined) return undefined;
  return {
    width: column.width === undefined ? undefined : `${column.width}px`,
    minWidth: column.minWidth === undefined ? undefined : `${column.minWidth}px`,
  };
}

function resolveSortState(
  sort: DataTableSort | null | undefined,
  sortControlled: boolean,
  internalSortKey: string | null,
  internalSortDirection: SortDirection,
): SortState {
  return {
    key: sortControlled ? (sort?.key ?? null) : internalSortKey,
    direction: sortControlled ? (sort?.direction ?? 'unsorted') : internalSortDirection,
  };
}

function sortRows<TRow>(
  rows: readonly TRow[],
  columns: readonly DataTableColumn<TRow>[],
  sortControlled: boolean,
  internalSortKey: string | null,
  internalSortDirection: SortDirection,
): readonly TRow[] {
  if (sortControlled) return rows;
  if (internalSortKey === null || internalSortDirection === 'unsorted') return rows;
  const column = columns.find((candidate) => candidate.key === internalSortKey);
  if (!column?.sortValue) return rows;
  const factor = internalSortDirection === 'asc' ? 1 : -1;
  return [...rows].sort(compareBySortValue(column.sortValue, factor));
}

function compareBySortValue<TRow>(
  sortValue: (row: TRow) => string | number,
  factor: number,
): (left: TRow, right: TRow) => number {
  return (left, right) => {
    const leftValue = sortValue(left);
    const rightValue = sortValue(right);
    if (leftValue < rightValue) return -1 * factor;
    if (leftValue > rightValue) return 1 * factor;
    return 0;
  };
}

function pageState<TRow>({
  rows,
  totalCount,
  pageSize,
  pageControlled,
  page,
  internalPage,
}: {
  readonly rows: readonly TRow[];
  readonly totalCount?: number;
  readonly pageSize: number;
  readonly pageControlled: boolean;
  readonly page?: number;
  readonly internalPage: number;
}): PageState<TRow> {
  const total = totalCount ?? rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(
    Math.max(0, pageControlled ? (page ?? 0) : internalPage),
    pageCount - 1,
  );
  const pageRows = pageControlled
    ? rows
    : rows.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize);
  return { total, pageCount, clampedPage, pageRows };
}

function selectionState<TRow>(
  sortedRows: readonly TRow[],
  rowKey: (row: TRow) => string,
  effectiveSelected: ReadonlySet<string>,
): SelectionState {
  const allKeys = sortedRows.map(rowKey);
  const selectedCount = effectiveSelected.size;
  const allSelected = allKeys.length > 0 && allKeys.every((key) => effectiveSelected.has(key));
  return {
    allKeys,
    selectedCount,
    allSelected,
    headerChecked: headerCheckedState(allSelected, selectedCount),
  };
}

function headerCheckedState(
  allSelected: boolean,
  selectedCount: number,
): boolean | 'indeterminate' {
  if (allSelected) return true;
  if (selectedCount > 0) return 'indeterminate';
  return false;
}

function tableColSpan<TRow>(
  visibleColumns: readonly DataTableColumn<TRow>[],
  selectable: boolean,
  rowActions?: (row: TRow) => ReactNode,
): number {
  let count = visibleColumns.length;
  if (selectable) count += 1;
  if (rowActions) count += 1;
  return count;
}

function tableColDefs<TRow>(
  visibleColumns: readonly DataTableColumn<TRow>[],
  selectable: boolean,
  rowActions?: (row: TRow) => ReactNode,
): readonly DataTableColDef[] {
  return [
    ...(selectable ? [{ key: '__select', className: 'ui-data-table__col--select' }] : []),
    ...visibleColumns.map((column) => ({ key: column.key, style: colStyle(column) })),
    ...(rowActions ? [{ key: '__actions', className: 'ui-data-table__col--actions' }] : []),
  ];
}

function emitTableSelection(
  next: ReadonlySet<string>,
  selectionControlled: boolean,
  onSelectionChange: ((keys: readonly string[]) => void) | undefined,
  setInternalSelected: (next: ReadonlySet<string>) => void,
): void {
  if (selectionControlled) onSelectionChange?.([...next]);
  else setInternalSelected(next);
}

function setTablePage(
  next: number,
  pageCount: number,
  pageControlled: boolean,
  onPageChange: ((page: number) => void) | undefined,
  setInternalPage: (page: number) => void,
): void {
  const clamped = Math.min(Math.max(0, next), pageCount - 1);
  if (pageControlled) onPageChange?.(clamped);
  else setInternalPage(clamped);
}

function setTableSort({
  key,
  effectiveSortKey,
  effectiveSortDirection,
  sortControlled,
  onSortChange,
  setInternalSortKey,
  setInternalSortDirection,
}: {
  readonly key: string;
  readonly effectiveSortKey: string | null;
  readonly effectiveSortDirection: SortDirection;
  readonly sortControlled: boolean;
  readonly onSortChange?: (sort: DataTableSort | null) => void;
  readonly setInternalSortKey: (key: string | null) => void;
  readonly setInternalSortDirection: (direction: SortDirection) => void;
}): void {
  const currentForKey = effectiveSortKey === key ? effectiveSortDirection : 'unsorted';
  const direction = nextDirection(currentForKey);
  if (sortControlled) {
    onSortChange?.(direction === 'unsorted' ? null : { key, direction });
    return;
  }
  setInternalSortKey(direction === 'unsorted' ? null : key);
  setInternalSortDirection(direction);
}

function toggledSetValue(source: ReadonlySet<string>, key: string): ReadonlySet<string> {
  const next = new Set(source);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

function setTableHiddenKeys(
  next: ReadonlySet<string>,
  hiddenControlled: boolean,
  onHiddenKeysChange: ((keys: readonly string[]) => void) | undefined,
  setInternalHidden: (next: ReadonlySet<string>) => void,
): void {
  if (hiddenControlled) onHiddenKeysChange?.([...next]);
  else setInternalHidden(next);
}

function setTableDensity(
  value: DataTableDensity,
  densityControlled: boolean,
  onDensityChange: ((density: DataTableDensity) => void) | undefined,
  setInternalDensity: (value: DataTableDensity) => void,
): void {
  if (densityControlled) onDensityChange?.(value);
  else setInternalDensity(value);
}

function stopPropagation(event: { stopPropagation: () => void }): void {
  event.stopPropagation();
}

function useFrozenColumnWidths(
  loading: boolean,
  isEmpty: boolean,
): {
  readonly headRowRef: RefObject<HTMLTableRowElement | null>;
  readonly frozenWidths: RefObject<number[]>;
  readonly freezeWidths: boolean;
} {
  const headRowRef = useRef<HTMLTableRowElement>(null);
  const frozenWidths = useRef<number[]>([]);

  useLayoutEffect(() => {
    freezeColumnWidthsWhenRowsPresent(loading, isEmpty, headRowRef, frozenWidths);
  });

  return {
    headRowRef,
    frozenWidths,
    freezeWidths: isEmpty && frozenWidths.current.length > 0,
  };
}

function freezeColumnWidthsWhenRowsPresent(
  loading: boolean,
  isEmpty: boolean,
  headRowRef: RefObject<HTMLTableRowElement | null>,
  frozenWidths: RefObject<number[]>,
): void {
  if (loading || isEmpty) return;
  const row = headRowRef.current;
  if (!row) return;
  frozenWidths.current = Array.from(
    row.children,
    (cell) => (cell as HTMLElement).getBoundingClientRect().width,
  );
}

export function useDataTableState<TRow>({
  columns,
  rows,
  rowKey,
  pageSize = 25,
  selectable = false,
  loading = false,
  density,
  defaultDensity,
  onDensityChange,
  hiddenKeys,
  defaultHiddenKeys,
  onHiddenKeysChange,
  selectedKeys,
  onSelectionChange,
  sort,
  onSortChange,
  page,
  onPageChange,
  totalCount,
  rowActions,
}: DataTableProps<TRow>): DataTableState<TRow> {
  const [internalSortKey, setInternalSortKey] = useState<string | null>(null);
  const [internalSortDirection, setInternalSortDirection] = useState<SortDirection>('unsorted');
  const [internalSelected, setInternalSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [internalPage, setInternalPage] = useState(0);
  const [internalHidden, setInternalHidden] = useState<ReadonlySet<string>>(
    () => new Set(defaultHiddenKeys ?? []),
  );
  const [internalDensity, setInternalDensity] = useState<DataTableDensity>(
    defaultDensity ?? 'comfortable',
  );

  const sortControlled = sort !== undefined;
  const selectionControlled = selectedKeys !== undefined;
  const hiddenControlled = hiddenKeys !== undefined;
  const densityControlled = density !== undefined;
  const pageControlled = page !== undefined;
  const sortState = resolveSortState(sort, sortControlled, internalSortKey, internalSortDirection);
  const effectiveSelected = useMemo(
    () => (selectionControlled ? new Set(selectedKeys) : internalSelected),
    [selectionControlled, selectedKeys, internalSelected],
  );
  const effectiveHidden = hiddenControlled ? new Set(hiddenKeys) : internalHidden;
  const effectiveDensity = densityControlled ? (density ?? 'comfortable') : internalDensity;
  const visibleColumns = columns.filter((column) => !effectiveHidden.has(column.key));
  const hideableColumns = columns.filter((column) => column.hideable);
  const sortedRows = useMemo(
    () => sortRows(rows, columns, sortControlled, internalSortKey, internalSortDirection),
    [rows, columns, sortControlled, internalSortKey, internalSortDirection],
  );
  const pages = pageState({
    rows: sortedRows,
    totalCount,
    pageSize,
    pageControlled,
    page,
    internalPage,
  });
  const selection = selectionState(sortedRows, rowKey, effectiveSelected);
  const isEmpty = !loading && rows.length === 0;
  const frozen = useFrozenColumnWidths(loading, isEmpty);

  const emitSelection = (next: ReadonlySet<string>): void =>
    emitTableSelection(next, selectionControlled, onSelectionChange, setInternalSelected);
  const goToPage = (next: number): void =>
    setTablePage(next, pages.pageCount, pageControlled, onPageChange, setInternalPage);
  const handleSort = (key: string): void =>
    setTableSort({
      key,
      effectiveSortKey: sortState.key,
      effectiveSortDirection: sortState.direction,
      sortControlled,
      onSortChange,
      setInternalSortKey,
      setInternalSortDirection,
    });
  const toggleAll = (): void =>
    emitSelection(selection.allSelected ? new Set() : new Set(selection.allKeys));
  const toggleRow = (key: string): void => emitSelection(toggledSetValue(effectiveSelected, key));
  const toggleColumn = (key: string): void =>
    setTableHiddenKeys(
      toggledSetValue(effectiveHidden, key),
      hiddenControlled,
      onHiddenKeysChange,
      setInternalHidden,
    );
  const setDensity = (value: DataTableDensity): void =>
    setTableDensity(value, densityControlled, onDensityChange, setInternalDensity);

  return {
    effectiveSortKey: sortState.key,
    effectiveSortDirection: sortState.direction,
    effectiveSelected,
    effectiveHidden,
    effectiveDensity,
    visibleColumns,
    hideableColumns,
    pageRows: pages.pageRows,
    total: pages.total,
    pageCount: pages.pageCount,
    clampedPage: pages.clampedPage,
    pageSize,
    selectable,
    loading,
    allKeys: selection.allKeys,
    selectedCount: selection.selectedCount,
    headerChecked: selection.headerChecked,
    colSpan: tableColSpan(visibleColumns, selectable, rowActions),
    isEmpty,
    showColumnsMenu: hideableColumns.length > 0,
    hasToolbar:
      hideableColumns.length > 0 || onDensityChange !== undefined || defaultDensity !== undefined,
    headRowRef: frozen.headRowRef,
    frozenWidths: frozen.frozenWidths,
    freezeWidths: frozen.freezeWidths,
    colDefs: tableColDefs(visibleColumns, selectable, rowActions),
    goToPage,
    handleSort,
    emitSelection,
    toggleAll,
    toggleRow,
    toggleColumn,
    setDensity,
    stop: stopPropagation,
  };
}

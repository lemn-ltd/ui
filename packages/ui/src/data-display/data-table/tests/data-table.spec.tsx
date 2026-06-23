import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DataTable, type DataTableColumn } from '../data-table.js';

interface Row {
  readonly id: string;
  readonly name: string;
}

const ROWS: Row[] = [
  { id: '1', name: 'Charlie' },
  { id: '2', name: 'Alice' },
  { id: '3', name: 'Bob' },
];

const COLUMNS: DataTableColumn<Row>[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    render: (row) => row.name,
    sortValue: (row) => row.name,
  },
];

function renderTable(props: Partial<Parameters<typeof DataTable<Row>>[0]> = {}) {
  return render(
    <DataTable<Row> columns={COLUMNS} rowKey={(row) => row.id} rows={ROWS} selectable {...props} />,
  );
}

function rowNames(): string[] {
  return Array.from(document.querySelectorAll('.ui-data-table__row')).map(
    (row) =>
      row.querySelector('.ui-data-table__td:not(.ui-data-table__td--select)')?.textContent ?? '',
  );
}

describe('DataTable', () => {
  afterEach(() => cleanup());

  it('cycles the sort tri-state unsorted -> asc -> desc -> unsorted', () => {
    renderTable();
    const sort = document.querySelector('.ui-data-table__sort') as HTMLElement;
    expect(sort.getAttribute('data-sort')).toBe('unsorted');

    fireEvent.click(sort);
    expect(sort.getAttribute('data-sort')).toBe('asc');
    expect(rowNames()).toEqual(['Alice', 'Bob', 'Charlie']);

    fireEvent.click(sort);
    expect(sort.getAttribute('data-sort')).toBe('desc');
    expect(rowNames()).toEqual(['Charlie', 'Bob', 'Alice']);

    fireEvent.click(sort);
    expect(sort.getAttribute('data-sort')).toBe('unsorted');
    expect(rowNames()).toEqual(['Charlie', 'Alice', 'Bob']);
  });

  it('selects a single row and reflects data-selected', () => {
    renderTable();
    const rowCheckbox = document.querySelectorAll(
      '.ui-data-table__td--select .ui-checkbox',
    )[0] as HTMLElement;
    fireEvent.click(rowCheckbox);

    const firstRow = document.querySelector('.ui-data-table__row') as HTMLElement;
    expect(firstRow.getAttribute('data-selected')).toBe('true');
  });

  it('shows the bulk actions bar only when rows are selected', () => {
    renderTable();
    expect(document.querySelector('.ui-data-table__bulk')).toBeNull();

    const rowCheckbox = document.querySelectorAll(
      '.ui-data-table__td--select .ui-checkbox',
    )[0] as HTMLElement;
    fireEvent.click(rowCheckbox);

    const bulk = document.querySelector('.ui-data-table__bulk');
    expect(bulk).not.toBeNull();
    expect(bulk?.textContent).toContain('1 selected');
  });

  it('select-all marks the header checked and partial selection indeterminate', () => {
    renderTable();
    const headerCheckbox = document.querySelector(
      '.ui-data-table__th--select .ui-checkbox',
    ) as HTMLElement;

    fireEvent.click(headerCheckbox);
    expect(
      Array.from(document.querySelectorAll('.ui-data-table__row')).every(
        (row) => row.getAttribute('data-selected') === 'true',
      ),
    ).toBe(true);
    expect(headerCheckbox.getAttribute('data-state')).toBe('checked');

    // Deselect one row -> header becomes indeterminate.
    const rowCheckbox = document.querySelectorAll(
      '.ui-data-table__td--select .ui-checkbox',
    )[0] as HTMLElement;
    fireEvent.click(rowCheckbox);
    expect(headerCheckbox.getAttribute('data-state')).toBe('indeterminate');
  });

  it('clears the selection through the bulk Clear control', () => {
    renderTable();
    const rowCheckbox = document.querySelectorAll(
      '.ui-data-table__td--select .ui-checkbox',
    )[0] as HTMLElement;
    fireEvent.click(rowCheckbox);

    fireEvent.click(document.querySelector('.ui-data-table__bulk-clear') as HTMLElement);
    expect(document.querySelector('.ui-data-table__bulk')).toBeNull();
  });

  it('paginates with the numbered footer and changes the visible page', () => {
    const manyRows: Row[] = Array.from({ length: 5 }, (_, index) => ({
      id: String(index),
      name: `Row ${index}`,
    }));
    render(
      <DataTable<Row>
        columns={[{ key: 'name', header: 'Name', render: (row) => row.name }]}
        pageSize={2}
        rowKey={(row) => row.id}
        rows={manyRows}
      />,
    );

    expect(document.querySelector('.ui-pagination__range')?.textContent).toBe('1–2 of 5');
    expect(document.querySelectorAll('.ui-data-table__row')).toHaveLength(2);

    fireEvent.click(document.querySelector('[aria-label="Next page"]') as HTMLElement);
    expect(document.querySelector('.ui-pagination__range')?.textContent).toBe('3–4 of 5');
  });

  it('renders the shared no-results EmptyState when there are no rows', () => {
    render(<DataTable<Row> columns={COLUMNS} rowKey={(row) => row.id} rows={[]} />);
    const empty = document.querySelector('.ui-empty-state');
    expect(empty?.getAttribute('data-intent')).toBe('no-results');
    expect(empty?.textContent).toContain('No results');
  });

  it('fires onRowClick from a content cell but not from the select or actions cell', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable<Row>
        columns={[{ key: 'name', header: 'Name', render: (row) => row.name }]}
        onRowClick={onRowClick}
        rowActions={() => <button type="button">Actions</button>}
        rowKey={(row) => row.id}
        rows={ROWS}
        selectable
      />,
    );
    const firstRow = document.querySelector('.ui-data-table__row') as HTMLElement;
    fireEvent.click(
      firstRow.querySelector(
        '.ui-data-table__td:not(.ui-data-table__td--select):not(.ui-data-table__td--actions)',
      ) as HTMLElement,
    );
    expect(onRowClick).toHaveBeenCalledTimes(1);

    fireEvent.click(firstRow.querySelector('.ui-data-table__td--select') as HTMLElement);
    fireEvent.click(firstRow.querySelector('.ui-data-table__td--actions') as HTMLElement);
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });

  it('renders a row-actions cell per row', () => {
    render(
      <DataTable<Row>
        columns={[{ key: 'name', header: 'Name', render: (row) => row.name }]}
        rowActions={(row) => <button type="button">act-{row.id}</button>}
        rowKey={(row) => row.id}
        rows={ROWS}
      />,
    );
    expect(document.querySelectorAll('.ui-data-table__td--actions')).toHaveLength(ROWS.length);
  });

  it('shows skeleton rows while loading', () => {
    render(<DataTable<Row> columns={COLUMNS} loading rowKey={(row) => row.id} rows={ROWS} />);
    expect(document.querySelectorAll('.ui-skeleton').length).toBeGreaterThan(0);
  });

  it('hides a column defaulted off and keeps it out of the header', () => {
    render(
      <DataTable<Row>
        columns={[
          { key: 'name', header: 'Name', render: (row) => row.name },
          { hideable: true, key: 'id', header: 'ID', render: (row) => row.id },
        ]}
        defaultHiddenKeys={['id']}
        rowKey={(row) => row.id}
        rows={ROWS}
      />,
    );
    const headers = Array.from(document.querySelectorAll('.ui-data-table__th')).map(
      (th) => th.textContent,
    );
    expect(headers).not.toContain('ID');
  });

  it('supports controlled selection and emits the next selection on toggle', () => {
    const onSelectionChange = vi.fn();
    render(
      <DataTable<Row>
        columns={COLUMNS}
        onSelectionChange={onSelectionChange}
        rowKey={(row) => row.id}
        rows={ROWS}
        selectable
        selectedKeys={['1']}
      />,
    );
    const firstRow = document.querySelector('.ui-data-table__row') as HTMLElement;
    expect(firstRow.getAttribute('data-selected')).toBe('true');

    fireEvent.click(
      document.querySelectorAll('.ui-data-table__td--select .ui-checkbox')[0] as HTMLElement,
    );
    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });
});

import { ComponentPage, ExampleBlock, PropsTable } from '@appranks/showcase-kit';
import { Button, DataTable, Icon, IconButton, Menu, MenuItem } from '@appranks/ui';
import type { ReactElement } from 'react';
import { columns, rowKey, rows } from '../../../fixtures';

// Full-width so the sticky header (capped at 480px scroll) and pagination read together.
const PREVIEW_STYLE = { width: '100%' } as const;

// A "manageable" column set: the numeric Value right-aligns; Owner, Updated and
// Reference become hideable so the column-visibility menu has something to toggle.
const manageableColumns = columns.map((column) => {
  if (column.key === 'value') return { ...column, align: 'end' as const };
  if (column.key === 'owner' || column.key === 'updated' || column.key === 'id') {
    return { ...column, hideable: true };
  }
  return column;
});

function rowActions(): ReactElement {
  return (
    <Menu
      trigger={
        <IconButton aria-label="Row actions" variant="ghost">
          <Icon name="ellipsis" size={16} />
        </IconButton>
      }
    >
      <MenuItem>Edit</MenuItem>
      <MenuItem>Duplicate</MenuItem>
      <MenuItem tone="danger">Delete</MenuItem>
    </Menu>
  );
}

function DataTablePage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A prop-driven table that owns its tri-state sort, row selection, pagination, column visibility and density — each switching from internal to controlled when you pass the matching prop. Callers supply rows, columns, and a row key; the filtered-empty surface reuses the shared no-results EmptyState."
      title="Data table"
    >
      <ExampleBlock
        code={`<DataTable
  columns={columns}
  rows={rows}
  rowKey={(row) => row.id}
  pageSize={25}
  selectable
  bulkActions={(keys) => (
    <>
      <Button variant="secondary">Archive {keys.length}</Button>
      <Button variant="danger">Delete</Button>
    </>
  )}
/>`}
        render={() => (
          <div style={PREVIEW_STYLE}>
            <DataTable
              bulkActions={(keys) => (
                <>
                  <Button variant="secondary">Archive {keys.length}</Button>
                  <Button variant="danger">Delete</Button>
                </>
              )}
              columns={columns}
              pageSize={25}
              rowKey={rowKey}
              rows={rows}
              selectable
            />
          </div>
        )}
      />

      <ExampleBlock
        code={`<DataTable
  columns={columns}        // a numeric column with align: 'end'; some hideable
  rows={rows}
  rowKey={(row) => row.id}
  selectable
  onRowClick={(row) => openEditor(row)}
  rowActions={(row) => (
    <Menu trigger={<IconButton aria-label="Row actions"><Icon name="ellipsis" /></IconButton>}>
      <MenuItem>Edit</MenuItem>
      <MenuItem tone="danger">Delete</MenuItem>
    </Menu>
  )}
/>
// Header toolbar (Columns menu + density toggle) appears when columns are hideable.`}
        render={() => (
          <div style={PREVIEW_STYLE}>
            <DataTable
              bulkActions={() => (
                <>
                  <Button variant="secondary">Export</Button>
                  <Button variant="danger">Delete</Button>
                </>
              )}
              columns={manageableColumns}
              onRowClick={() => {}}
              pageSize={8}
              rowActions={rowActions}
              rowKey={rowKey}
              rows={rows}
              selectable
            />
          </div>
        )}
      />

      <ExampleBlock
        code={`<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} loading />`}
        render={() => (
          <div style={PREVIEW_STYLE}>
            <DataTable columns={columns} loading rowKey={rowKey} rows={rows} />
          </div>
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'columns',
            type: 'readonly DataTableColumn<TRow>[]',
            description:
              'Column descriptors: key, header, render, optional sortable + sortValue, align, width/minWidth, and hideable.',
          },
          {
            name: 'rows',
            type: 'readonly TRow[]',
            description:
              'The dataset. Sliced and sorted in-memory unless page/sort are controlled (server-side).',
          },
          {
            name: 'rowKey',
            type: '(row: TRow) => string',
            description: 'Stable identity per row, used for React keys and selection tracking.',
          },
          {
            name: 'pageSize',
            type: 'number',
            defaultValue: '25',
            description:
              'Rows per page; numbered pagination appears only when more than one page exists.',
          },
          {
            name: 'selectable',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Adds the select-all header checkbox and a per-row checkbox column.',
          },
          {
            name: 'bulkActions',
            type: '(selectedKeys: readonly string[]) => ReactNode',
            description: 'Actions rendered in the BulkActionsBar shown while rows are selected.',
          },
          {
            name: 'onRowClick',
            type: '(row: TRow) => void',
            description:
              'Makes rows clickable. Clicks inside the select or actions cell are excluded.',
          },
          {
            name: 'rowActions',
            type: '(row: TRow) => ReactNode',
            description: 'Trailing per-row actions cell, typically a kebab Menu.',
          },
          {
            name: 'loading',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Renders skeleton rows matching the column grid.',
          },
          {
            name: 'density / onDensityChange',
            type: "'comfortable' | 'compact'",
            description:
              'Row density, uncontrolled by default. The toolbar density toggle appears alongside the column menu.',
          },
          {
            name: 'hiddenKeys / onHiddenKeysChange',
            type: 'readonly string[]',
            description:
              'Hidden column keys. Uncontrolled via defaultHiddenKeys; the Columns menu lists hideable columns.',
          },
          {
            name: 'selectedKeys / onSelectionChange',
            type: 'readonly string[]',
            description: 'Controlled selection — e.g. to clear it after a bulk action completes.',
          },
          {
            name: 'sort / onSortChange',
            type: 'DataTableSort | null',
            description:
              'Controlled sort. When set, the table reflects it and does not re-sort rows.',
          },
          {
            name: 'page / onPageChange / totalCount',
            type: 'number',
            description:
              'Controlled (server-side) pagination: the table renders rows as-is and totals from totalCount.',
          },
          {
            name: 'onClearFilters',
            type: '() => void',
            description: 'Handler for the no-results EmptyState shown when rows is empty.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default DataTablePage;

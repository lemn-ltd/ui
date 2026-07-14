import { ComponentPage, useShowcaseRenderMode } from '@lemn-ltd/showcase-kit';
import {
  ActiveFiltersRow,
  Button,
  ConfirmDialog,
  DataTable,
  Field,
  FileDropzone,
  Filter,
  FormDialog,
  Icon,
  IconButton,
  Input,
  InputSelect,
  ListFiltersBar,
  ListShell,
  Menu,
  MenuItem,
  notify,
  PageHeader,
  Sidebar,
  Textarea,
  Toaster,
  Toggle,
  TopBar,
} from '@lemn-ltd/ui';
import { type CSSProperties, type ReactElement, useState } from 'react';
import {
  columns as baseColumns,
  filters,
  navGroups,
  rowKey,
  rows as seedRows,
} from '../../../fixtures';

type Row = (typeof seedRows)[number];

const FRAME: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  height: 680,
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  background: 'var(--bg)',
};

const MAIN: CSSProperties = { display: 'flex', flexDirection: 'column', minWidth: 0 };
const CONTENT: CSSProperties = { flex: 1, minHeight: 0, overflow: 'auto' };

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
];

// Default policy: only the numeric Value right-aligns. No `hideable` columns and
// no `onDensityChange`, so the table shows no header toolbar (density / column
// visibility stay off until a denser surface needs them).
const columns = baseColumns.map((column) =>
  column.key === 'value' ? { ...column, align: 'end' as const } : column,
);

const appliedChips = filters
  .slice(0, 2)
  .filter((filter) => filter.selected.length > 0)
  .map((filter) => ({ label: `${filter.label}: ${filter.selected.length}`, onRemove: () => {} }));

function ResourceManagerPage(): ReactElement {
  const renderMode = useShowcaseRenderMode();
  const [rows, setRows] = useState<readonly Row[]>(seedRows);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<readonly string[]>([]);

  const [editing, setEditing] = useState<Row | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<readonly string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const visibleRows = rows.filter((row) =>
    row.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const openCreate = (): void => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (row: Row): void => {
    setEditing(row);
    setFormOpen(true);
  };

  const askDelete = (keys: readonly string[]): void => {
    setPendingDelete(keys);
    setConfirmOpen(true);
  };

  const submit = (): void => {
    setFormOpen(false);
    notify('success', editing ? 'Item updated' : 'Item created');
  };

  const confirmDelete = (): void => {
    const removed = new Set(pendingDelete);
    setRows((current) => current.filter((row) => !removed.has(rowKey(row))));
    setSelected((current) => current.filter((key) => !removed.has(key)));
    setConfirmOpen(false);
    notify('success', `${removed.size} item${removed.size === 1 ? '' : 's'} deleted`);
  };

  return (
    <ComponentPage
      status="beta"
      summary="The end-to-end CRUD screen, tuned to a non-invasive default: New or the row kebab (Edit · Delete) opens the create/edit FormDialog; rows are selectable for a bulk delete; up to two key filters sit beside a name search. Row-click-to-edit, density, column visibility and bulk export stay off until a surface needs them."
      title="Resource manager"
    >
      <>
        <div style={FRAME}>
        <Sidebar groups={navGroups} mode="expanded" />
        <div style={MAIN}>
          <TopBar />
          <div style={CONTENT}>
            <ListShell>
              <PageHeader
                actions={
                  <Button onClick={openCreate} variant="primary">
                    New item
                  </Button>
                }
                subtitle="Everything in this workspace."
                title="Items"
              />
              <ListFiltersBar
                onSearchChange={setSearch}
                // At most the two most relevant column filters; search is the
                // primary affordance and matches a single field (name).
                pills={filters
                  .slice(0, 2)
                  .map((filter) => (
                    <Filter
                      key={filter.id}
                      label={filter.label}
                      onSelect={() => {}}
                      options={filter.options}
                      select={filter.select}
                      selected={filter.selected}
                    />
                  ))}
                search={search}
                searchPlaceholder="Search by name"
              />
              {appliedChips.length > 0 ? (
                <ActiveFiltersRow filters={appliedChips} onClearAll={() => {}} />
              ) : null}
              <DataTable
                // Bulk delete only; Export stays hidden by default (add another
                // Button here when batch export is needed).
                bulkActions={(keys) => (
                  <Button onClick={() => askDelete(keys)} variant="danger">
                    Delete {keys.length}
                  </Button>
                )}
                columns={columns}
                onClearFilters={() => setSearch('')}
                onSelectionChange={setSelected}
                rowActions={(row) => (
                  <Menu
                    trigger={
                      <IconButton aria-label="Row actions" variant="ghost">
                        <Icon name="ellipsis" size={16} />
                      </IconButton>
                    }
                  >
                    <MenuItem onSelect={() => openEdit(row)}>Edit</MenuItem>
                    <MenuItem onSelect={() => askDelete([rowKey(row)])} tone="danger">
                      Delete
                    </MenuItem>
                  </Menu>
                )}
                rowKey={rowKey}
                rows={visibleRows}
                selectable
                selectedKeys={selected}
              />
            </ListShell>
          </div>
        </div>
        </div>

        <FormDialog
        onCancel={() => setFormOpen(false)}
        onOpenChange={setFormOpen}
        onSubmit={submit}
        open={formOpen}
        submitLabel={editing ? 'Save' : 'Create'}
        title={editing ? 'Edit item' : 'New item'}
      >
        <Field hint="Shown wherever this item appears." label="Name" required>
          {(control) => (
            <Input {...control} defaultValue={editing?.name} placeholder="e.g. Quarterly report" />
          )}
        </Field>
        <Field hint="Optional. Up to 500 characters." label="Description">
          {(control) => <Textarea {...control} placeholder="Add an optional description…" />}
        </Field>
        <Field label="Status">
          {(control) => (
            <InputSelect
              {...control}
              defaultValue={editing?.status ?? 'active'}
              options={STATUS_OPTIONS}
            />
          )}
        </Field>
        <Field hint="Members can use this item right away." label="Active">
          {(control) => <Toggle disabled={control.disabled} id={control.id} />}
        </Field>
        <Field hint="PNG, PDF or DOCX up to 10 MB." label="Attachments">
          {() => (
            <FileDropzone
              aria-label="Upload attachments"
              files={[]}
              multiple
              onFilesAccepted={() => {}}
            />
          )}
        </Field>
        </FormDialog>

        <ConfirmDialog
        confirmLabel={`Delete ${pendingDelete.length}`}
        description="This permanently removes the selected items. This action cannot be undone."
        onConfirm={confirmDelete}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        title="Delete items?"
        variant="danger"
        />

        {renderMode === 'card' ? null : <Toaster />}
      </>
    </ComponentPage>
  );
}

export default ResourceManagerPage;

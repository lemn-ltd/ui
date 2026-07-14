import { ComponentPage } from '@lemn-ltd/showcase-kit';
import {
  Button,
  DataTable,
  Filter,
  ListFiltersBar,
  ListShell,
  PageHeader,
  Sidebar,
  TopBar,
} from '@lemn-ltd/ui';
import { type CSSProperties, type ReactElement, useState } from 'react';
import { columns, filters, navGroups, rowKey, rows } from '../../../fixtures';

// A fixed-height bordered frame replicating the screen shell so the full
// list surface reads as a docs preview, not the page's own viewport.
const FRAME: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  height: 640,
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  background: 'var(--bg)',
};

const MAIN: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
};

const CONTENT: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
};

function ListTablePage(): ReactElement {
  const [search, setSearch] = useState('');

  return (
    <ComponentPage
      status="stable"
      summary="The canonical list screen: sidebar and top bar around a page header, a filter bar with dropdowns and search, and a paginated, sortable data table."
      title="List + table"
    >
      <div style={FRAME}>
        <Sidebar groups={navGroups} mode="expanded" />
        <div style={MAIN}>
          <TopBar />
          <div style={CONTENT}>
            <ListShell>
              <PageHeader
                actions={<Button variant="primary">New item</Button>}
                subtitle="Everything in this workspace."
                title="Items"
              />
              <ListFiltersBar
                onSearchChange={setSearch}
                pills={filters
                  .slice(0, 3)
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
                searchPlaceholder="Search items"
              />
              <DataTable columns={columns} rowKey={rowKey} rows={rows} />
            </ListShell>
          </div>
        </div>
      </div>
    </ComponentPage>
  );
}

export default ListTablePage;

import { ComponentPage } from '@lemn-ltd/showcase-kit';
import {
  Badge,
  Button,
  Card,
  DataTable,
  Filter,
  ListFiltersBar,
  ListShell,
  PageHeader,
  SectionGrid,
  Sidebar,
  TopBar,
} from '@lemn-ltd/ui';
import { type CSSProperties, type ReactElement, useState } from 'react';
import { columns, filters, navGroups, rowKey, rows, sectionCards } from '../../../fixtures';

// A fixed-height bordered frame replicating the screen shell. The composed
// surfaces reflow with the package CSS as the frame width changes.
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

const NOTE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  padding: 'var(--space-4)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--surface2)',
  fontSize: 'var(--font-size-small)',
  color: 'var(--text-muted)',
};

const NOTE_TITLE: CSSProperties = {
  fontSize: 'var(--font-size-body)',
  fontWeight: 600,
  color: 'var(--text)',
};

function ResponsivePage(): ReactElement {
  const [search, setSearch] = useState('');

  return (
    <ComponentPage
      status="stable"
      summary="How the shell reflows across breakpoints. The same composition reads as a desktop layout at 1280px, condenses at 768px, and collapses to a single column at 375px — driven entirely by the package CSS."
      title="Responsive"
    >
      <>
        <div style={NOTE}>
          <span style={NOTE_TITLE}>Target widths</span>
          <span>
            At 1280px the section grid runs three across and the table shows every column. At 768px
            the grid drops to two columns and the filter row scrolls horizontally. At 375px the grid
            becomes a single column and the table reflows to stacked cards.
          </span>
        </div>

        <div style={FRAME}>
        <Sidebar groups={navGroups} mode="expanded" />
        <div style={MAIN}>
          <TopBar />
          <div style={CONTENT}>
            <ListShell>
              <PageHeader
                actions={<Button variant="primary">New item</Button>}
                subtitle="Resize the frame to watch the surfaces reflow."
                title="Items"
              />
              <ListFiltersBar
                onSearchChange={setSearch}
                pills={filters.map((filter) => (
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
              <SectionGrid>
                {sectionCards.map((card) => (
                  <Card
                    footer={<Badge tone="neutral">{card.footer}</Badge>}
                    key={card.id}
                    title={card.title}
                  >
                    {card.body}
                  </Card>
                ))}
              </SectionGrid>
              <DataTable columns={columns} rowKey={rowKey} rows={rows} />
            </ListShell>
          </div>
        </div>
        </div>
      </>
    </ComponentPage>
  );
}

export default ResponsivePage;

import { ComponentPage } from '@portal/catalog-kit';
import {
  Badge,
  Button,
  Card,
  Filter,
  ListFiltersBar,
  ListShell,
  PageHeader,
  RelativeTime,
  SectionGrid,
  Sidebar,
  TopBar,
} from '@lemn-ltd/ui';
import { type CSSProperties, type ReactElement, useState } from 'react';
import { filters, navGroups, relativeNow, relativeSamples, sectionCards } from '../../../fixtures';

// A fixed-height bordered frame replicating the screen shell so the full
// grid surface reads as a docs preview, not the page's own viewport.
const FRAME: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  height: 640,
  border: '1px solid var(--lemn-color-border)',
  borderRadius: 'var(--lemn-radius-large)',
  overflow: 'hidden',
  background: 'var(--lemn-color-canvas)',
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

const CARD_FOOTER: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--lemn-space-3)',
};

function ListGridPage(): ReactElement {
  const [search, setSearch] = useState('');

  return (
    <ComponentPage
      status="stable"
      summary="A card-grid variant of the list screen: the same shell, header, and filter bar wrap a responsive section grid of summary cards instead of a table."
      title="List + grid"
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
              <SectionGrid>
                {sectionCards.map((card, index) => {
                  const sample = relativeSamples[index % relativeSamples.length];
                  return (
                    <Card
                      footer={
                        <div style={CARD_FOOTER}>
                          <Badge tone="neutral">{card.footer}</Badge>
                          {sample ? <RelativeTime now={relativeNow} value={sample.value} /> : null}
                        </div>
                      }
                      key={card.id}
                      title={card.title}
                    >
                      {card.body}
                    </Card>
                  );
                })}
              </SectionGrid>
            </ListShell>
          </div>
        </div>
      </div>
    </ComponentPage>
  );
}

export default ListGridPage;

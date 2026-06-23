import { ComponentPage, ExampleBlock, PropsTable } from '@appranks/showcase-kit';
import { Button, Filter, ListFiltersBar } from '@appranks/ui';
import { type ReactElement, useState } from 'react';
import { filters } from '../../../fixtures';

const STATUS = filters[0];
const OWNER = filters[1];

function toggle(current: readonly string[], value: string): string[] {
  return current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value];
}

function ListFiltersBarPage(): ReactElement {
  const [search, setSearch] = useState('');
  const [statusSelected, setStatusSelected] = useState<readonly string[]>([]);
  const [ownerSelected, setOwnerSelected] = useState<readonly string[]>([]);

  return (
    <ComponentPage
      status="stable"
      summary="A layout-only filter row: a left pills slot, an optional per-view searchable input, and an optional trailing slot. The bar owns no filter state of its own."
      title="List filters bar"
    >
      <ExampleBlock
        code={`const [search, setSearch] = useState('');

<ListFiltersBar
  search={search}
  onSearchChange={setSearch}
  searchPlaceholder="Search items"
  pills={
    <>
      <Filter label="Status" select="multi" {...statusProps} />
      <Filter label="Owner" select="single" {...ownerProps} />
    </>
  }
  trailing={<Button variant="secondary">New item</Button>}
/>`}
        render={() => (
          <ListFiltersBar
            onSearchChange={setSearch}
            pills={
              <>
                <Filter
                  label={STATUS?.label ?? 'Status'}
                  onSelect={(value) => setStatusSelected((current) => toggle(current, value))}
                  options={STATUS?.options ?? []}
                  select="multi"
                  selected={statusSelected}
                />
                <Filter
                  label={OWNER?.label ?? 'Owner'}
                  onSelect={(value) => setOwnerSelected([value])}
                  options={OWNER?.options ?? []}
                  select="single"
                  selected={ownerSelected}
                />
              </>
            }
            search={search}
            searchPlaceholder="Search items"
            trailing={<Button variant="secondary">New item</Button>}
          />
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'pills',
            type: 'ReactNode',
            description: 'Leading slot, normally a set of Filter triggers.',
          },
          {
            name: 'search',
            type: 'string | undefined',
            description:
              'Optional current search text; when search and onSearchChange are omitted, no search input is rendered.',
          },
          {
            name: 'onSearchChange',
            type: '((next: string) => void) | undefined',
            description:
              'Optional search handler; the search input renders only when this handler is provided.',
          },
          {
            name: 'searchPlaceholder',
            type: 'string',
            description: 'Per-view placeholder for the search input.',
          },
          {
            name: 'searchLabel',
            type: 'string',
            defaultValue: "'Search list'",
            description: 'Accessible name for the search input.',
          },
          {
            name: 'trailing',
            type: 'ReactNode',
            description: 'Optional slot rendered after the search input.',
          },
          {
            name: 'className',
            type: 'string',
            description: 'Extra class names appended to the root.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default ListFiltersBarPage;

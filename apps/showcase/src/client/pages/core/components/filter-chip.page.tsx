import { ComponentPage, ExampleBlock, PropsTable } from '@appranks/showcase-kit';
import { ActiveFiltersRow, FilterChip } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';

interface AppliedFilter {
  readonly id: string;
  readonly label: string;
}

const INITIAL: readonly AppliedFilter[] = [
  { id: 'status-active', label: 'Status: Active' },
  { id: 'status-pending', label: 'Status: Pending' },
  { id: 'owner-me', label: 'Owner: Me' },
  { id: 'updated-week', label: 'Updated: This week' },
  { id: 'tag-alpha', label: 'Tag: Alpha' },
];

function FilterChipPage(): ReactElement {
  const [applied, setApplied] = useState<readonly AppliedFilter[]>(INITIAL);

  return (
    <ComponentPage
      status="stable"
      summary="An applied-filter pill in accent-soft tone with a trailing remove control. ActiveFiltersRow wraps a set of chips and adds a trailing Clear all control."
      title="Filter chip"
    >
      <ExampleBlock
        code={`<FilterChip label="Status: Active" onRemove={() => remove('status')} />`}
        render={() => <FilterChip label="Status: Active" onRemove={() => undefined} />}
      />

      <ExampleBlock
        code={`const [applied, setApplied] = useState(initialFilters);

<ActiveFiltersRow
  filters={applied.map((filter) => ({
    label: filter.label,
    onRemove: () => setApplied((current) => current.filter((f) => f.id !== filter.id)),
  }))}
  onClearAll={() => setApplied([])}
/>`}
        render={() => (
          <ActiveFiltersRow
            filters={applied.map((filter) => ({
              label: filter.label,
              onRemove: () =>
                setApplied((current) => current.filter((entry) => entry.id !== filter.id)),
            }))}
            onClearAll={() => setApplied([])}
          />
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'label',
            type: 'ReactNode',
            description: 'FilterChip — the applied-filter text.',
          },
          {
            name: 'onRemove',
            type: '() => void',
            description: 'FilterChip — when set, renders the trailing remove control.',
          },
          {
            name: 'removeLabel',
            type: 'string',
            defaultValue: "'Remove filter'",
            description: 'FilterChip — accessible name for the remove control.',
          },
          {
            name: 'filters',
            type: 'readonly FilterChipProps[]',
            description: 'ActiveFiltersRow — the chips to render, wrapping as the row narrows.',
          },
          {
            name: 'onClearAll',
            type: '() => void',
            description:
              'ActiveFiltersRow — when set with chips present, renders the Clear all control.',
          },
          {
            name: 'clearAllLabel',
            type: 'ReactNode',
            defaultValue: "'Clear all'",
            description: 'ActiveFiltersRow — label for the trailing clear control.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default FilterChipPage;

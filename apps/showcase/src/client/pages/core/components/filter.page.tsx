import { ComponentPage, ExampleBlock, PropsTable } from '@appranks/showcase-kit';
import { type DateRange, Filter, type NumberRange } from '@appranks/ui';
import { type ReactElement, useState } from 'react';
import { filters } from '../../../fixtures';

const STATUS = filters[0];
const OWNER = filters[1];

function toggle(current: readonly string[], value: string): string[] {
  return current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value];
}

function TypedFilters(): ReactElement {
  const [text, setText] = useState('');
  const [range, setRange] = useState<NumberRange>({});
  const [dates, setDates] = useState<DateRange>({});
  const [active, setActive] = useState<boolean | null>(null);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      <Filter label="Name" onChange={setText} type="text" value={text} />
      <Filter label="Value" onChange={setRange} type="number-range" value={range} />
      <Filter label="Updated" onChange={setDates} type="date-range" value={dates} />
      <Filter label="Active" onChange={setActive} type="boolean" value={active} />
    </div>
  );
}

function FilterPage(): ReactElement {
  const [statusSelected, setStatusSelected] = useState<readonly string[]>(STATUS?.selected ?? []);
  const [ownerSelected, setOwnerSelected] = useState<readonly string[]>(OWNER?.selected ?? []);

  return (
    <ComponentPage
      status="stable"
      summary="One type-driven column filter sharing a FilterPill trigger. enum (the default) opens a checkable Menu for single/multi selection; text, number-range, date-range and boolean open a Popover with the matching inputs."
      title="Filter"
    >
      <ExampleBlock
        code={`<Filter
  label="Status"
  select="multi"
  options={statusOptions}
  selected={selected}
  onSelect={(value) => setSelected((current) => toggle(current, value))}
/>
<Filter label="Owner" select="single" options={ownerOptions} selected={owner} onSelect={(v) => setOwner([v])} />`}
        render={() => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
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
          </div>
        )}
      />

      <ExampleBlock
        code={`<Filter label="Name" type="text" value={text} onChange={setText} />
<Filter label="Value" type="number-range" value={range} onChange={setRange} />
<Filter label="Updated" type="date-range" value={dates} onChange={setDates} />
<Filter label="Active" type="boolean" value={active} onChange={setActive} />`}
        render={() => <TypedFilters />}
      />

      <PropsTable
        rows={[
          {
            name: 'type',
            type: "'enum' | 'text' | 'number-range' | 'date-range' | 'boolean'",
            defaultValue: "'enum'",
            description: 'Selects the trigger body and the value/onChange shape.',
          },
          {
            name: 'label',
            type: 'string',
            description: 'Leading label shown before the applied-value summary.',
          },
          {
            name: 'options / selected / onSelect / select',
            type: 'enum only',
            description:
              'Checkable rows, controlled selection, toggle handler, and single|multi mode.',
          },
          {
            name: 'value / onChange',
            type: 'string | NumberRange | DateRange | boolean | null',
            description: 'Controlled value and change handler for the text/range/boolean variants.',
          },
          {
            name: 'placeholder',
            type: 'string',
            description: 'enum summary when empty (default "Any"), or the text input placeholder.',
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

export default FilterPage;

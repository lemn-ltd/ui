import {
  ComponentPage,
  ControlRow,
  Controls,
  ExampleBlock,
  PropsTable,
  VariantsGallery,
} from '@lemn-ltd/showcase-kit';
import { FilterPill } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';

function FilterPillPage(): ReactElement {
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <ComponentPage
      status="stable"
      summary="A toggleable filter trigger with a trailing chevron. The active and open booleans drive data-active and data-open."
      title="Filter pill"
    >
      <ExampleBlock
        code={`const [active, setActive] = useState(false);

<FilterPill active={active} onClick={() => setActive((value) => !value)}>
  Status
</FilterPill>`}
        render={() => (
          <FilterPill active={active} onClick={() => setActive((value) => !value)}>
            Status
          </FilterPill>
        )}
      />

      <Controls>
        <ControlRow label="active">
          <input
            aria-label="active"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            type="checkbox"
          />
        </ControlRow>
        <ControlRow label="open">
          <input
            aria-label="open"
            checked={open}
            onChange={(event) => setOpen(event.target.checked)}
            type="checkbox"
          />
        </ControlRow>
      </Controls>

      <VariantsGallery
        items={[
          { label: 'rest', render: () => <FilterPill>Status</FilterPill> },
          { label: 'active', render: () => <FilterPill active>Status</FilterPill> },
          { label: 'open', render: () => <FilterPill open>Status</FilterPill> },
          {
            label: 'active · open',
            render: () => (
              <FilterPill active open>
                Status
              </FilterPill>
            ),
          },
          { label: 'disabled', render: () => <FilterPill disabled>Status</FilterPill> },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'active',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Whether a filter value is applied; written to data-active.',
          },
          {
            name: 'open',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Whether the attached menu is open; written to data-open.',
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: 'The pill label.',
          },
          {
            name: '…rest',
            type: 'ButtonHTMLAttributes<HTMLButtonElement>',
            description: 'Native button props (onClick, disabled, …); type defaults to "button".',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default FilterPillPage;

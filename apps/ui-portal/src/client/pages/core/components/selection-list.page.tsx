import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@portal/catalog-kit';
import { SelectionList } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';
import { selectionListDefaultValue, selectionListGroups } from '../../../fixtures';

// A fixed width keeps the grouped rows readable inside preview cells.
const wrap = { width: '32rem' } as const;

function ControlledExample(): ReactElement {
  const [value, setValue] = useState<string[]>([...selectionListDefaultValue]);
  return (
    <div style={wrap}>
      <SelectionList
        groups={selectionListGroups}
        onValueChange={setValue}
        searchPlaceholder="Search tools…"
        value={value}
      />
    </div>
  );
}

function SelectionListPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="Searchable multi-select over a one-level hierarchy: the toolbar shows search, selected count, Select all, and Clear actions; category pills narrow the list; group headers select visible items with an indeterminate state."
      title="SelectionList"
    >
      <ExampleBlock
        code={`<SelectionList
  groups={toolGroups}
  value={selected}
  onValueChange={setSelected}
  searchPlaceholder="Search tools…"
/>`}
        render={() => <ControlledExample />}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'empty selection',
            render: () => (
              <div style={wrap}>
                <SelectionList groups={selectionListGroups} value={[]} />
              </div>
            ),
          },
          {
            label: 'disabled',
            render: () => (
              <div style={wrap}>
                <SelectionList
                  disabled
                  groups={selectionListGroups}
                  value={[...selectionListDefaultValue]}
                />
              </div>
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'groups',
            type: 'readonly SelectionListGroup[]',
            description:
              'One-level hierarchy: each group has key, label, and items (key, label, optional description, keywords, badge, disabled).',
          },
          {
            name: 'value',
            type: 'readonly string[]',
            description: 'Controlled selection as item keys.',
          },
          {
            name: 'onValueChange',
            type: '(value: string[]) => void',
            description:
              'Fires with the full next selection when any checkbox, group select-all, toolbar Select all, or Clear changes it.',
          },
          {
            name: 'searchPlaceholder',
            type: 'string',
            defaultValue: "'Search…'",
            description: 'Placeholder and aria-label of the filter input.',
          },
          {
            name: 'allLabel',
            type: 'string',
            defaultValue: "'All'",
            description: 'Label of the leading category pill that clears the category filter.',
          },
          {
            name: 'emptyMessage',
            type: 'string',
            defaultValue: "'No items match'",
            description: 'Title of the empty state when the filter matches nothing.',
          },
          {
            name: 'emptyHint',
            type: 'string',
            defaultValue: "'Clear the search or pick another category'",
            description: 'Secondary line of the empty state.',
          },
          {
            name: 'disabled',
            type: 'boolean',
            description: 'Disables the search, pills, checkboxes, Select all, and Clear actions.',
          },
          {
            name: 'className',
            type: 'string',
            description: 'Extra class appended to the root.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default SelectionListPage;

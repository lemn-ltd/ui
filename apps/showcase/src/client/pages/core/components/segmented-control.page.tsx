import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@lemn-ltd/showcase-kit';
import { SegmentedControl, type SegmentedControlSegment } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';

const VIEW_SEGMENTS: readonly SegmentedControlSegment[] = [
  { value: 'list', label: 'List' },
  { value: 'board', label: 'Board' },
  { value: 'timeline', label: 'Timeline' },
];

const ICON_SEGMENTS: readonly SegmentedControlSegment[] = [
  { value: 'grid', label: 'Grid', icon: 'layout-grid' },
  { value: 'rows', label: 'Rows', icon: 'panel-left-open' },
];

const DISABLED_SEGMENTS: readonly SegmentedControlSegment[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month', disabled: true },
];

function ViewSwitcher(): ReactElement {
  const [value, setValue] = useState('board');
  return (
    <SegmentedControl
      aria-label="View"
      onValueChange={setValue}
      segments={VIEW_SEGMENTS}
      value={value}
    />
  );
}

function SegmentedControlPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="Single-select control on a recessed track. The pressed segment rises to a raised pill; re-pressing the active segment keeps it selected."
      title="Segmented control"
    >
      <ExampleBlock
        code={`const [value, setValue] = useState('board');

<SegmentedControl
  aria-label="View"
  segments={[
    { value: 'list', label: 'List' },
    { value: 'board', label: 'Board' },
    { value: 'timeline', label: 'Timeline' },
  ]}
  value={value}
  onValueChange={setValue}
/>`}
        render={() => <ViewSwitcher />}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'with icons',
            render: () => (
              <SegmentedControl aria-label="Layout" defaultValue="grid" segments={ICON_SEGMENTS} />
            ),
          },
          {
            label: 'segment disabled',
            render: () => (
              <SegmentedControl
                aria-label="Range"
                defaultValue="day"
                segments={DISABLED_SEGMENTS}
              />
            ),
          },
          {
            label: 'control disabled',
            render: () => (
              <SegmentedControl
                aria-label="View"
                defaultValue="board"
                disabled
                segments={VIEW_SEGMENTS}
              />
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'segments',
            type: 'readonly SegmentedControlSegment[]',
            description:
              'The selectable segments. Each has value, label, optional icon, and optional disabled.',
          },
          {
            name: 'value',
            type: 'string',
            description: 'Controlled selected value.',
          },
          {
            name: 'defaultValue',
            type: 'string',
            description: 'Uncontrolled initial value.',
          },
          {
            name: 'onValueChange',
            type: '(value: string) => void',
            description:
              'Fires when a segment is pressed. A deselect to empty string is swallowed.',
          },
          {
            name: 'disabled',
            type: 'boolean',
            description: 'Disables the whole control.',
          },
          {
            name: 'aria-label',
            type: 'string',
            description: 'Accessible name for the toggle group.',
          },
          {
            name: 'className',
            type: 'string',
            description: 'Extra class appended to the control root.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default SegmentedControlPage;

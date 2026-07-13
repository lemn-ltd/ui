import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { Button, Popover, type PopoverPlacement } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const PLACEMENTS: readonly PopoverPlacement[] = ['top', 'bottom', 'left', 'right'];

function PopoverPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A non-modal floating panel anchored to a trigger. Placement sets the preferred side and is reflected on data-side; an optional arrow points back at the trigger."
      title="Popover"
    >
      <ExampleBlock
        code={`<Popover
  arrow
  placement="bottom"
  trigger={<Button variant="secondary">Open popover</Button>}
>
  <p>Anchored, dismissible content.</p>
</Popover>`}
        render={() => (
          <Popover
            arrow
            placement="bottom"
            trigger={<Button variant="secondary">Open popover</Button>}
          >
            <p>Anchored, dismissible content.</p>
          </Popover>
        )}
      />

      <VariantsGallery
        columns={4}
        items={PLACEMENTS.map((placement) => ({
          label: placement,
          render: () => (
            <Popover
              arrow
              placement={placement}
              trigger={<Button variant="secondary">{placement}</Button>}
            >
              <p>Side: {placement}</p>
            </Popover>
          ),
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'trigger',
            type: 'ReactNode',
            description: 'Element that toggles the popover, rendered as the trigger child.',
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: 'Content of the floating panel.',
          },
          {
            name: 'placement',
            type: "'top' | 'bottom' | 'left' | 'right'",
            defaultValue: "'bottom'",
            description: 'Preferred side, passed to the content as data-side.',
          },
          {
            name: 'arrow',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Renders an arrow pointing back at the trigger.',
          },
          {
            name: 'open',
            type: 'boolean',
            description: 'Controlled open state.',
          },
          {
            name: 'defaultOpen',
            type: 'boolean',
            description: 'Initial open state for uncontrolled use.',
          },
          {
            name: 'onOpenChange',
            type: '(open: boolean) => void',
            description: 'Called when the open state changes.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default PopoverPage;

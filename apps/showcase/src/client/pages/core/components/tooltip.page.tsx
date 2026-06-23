import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { Button, Tooltip, type TooltipPlacement } from '@appranks/ui';
import type { ReactElement } from 'react';

const PLACEMENTS: readonly TooltipPlacement[] = ['top', 'bottom', 'left', 'right'];

function TooltipPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A small label that appears on hover or focus of its child. The child is the trigger; placement sets the preferred side and an arrow always points back at it."
      title="Tooltip"
    >
      <ExampleBlock
        code={`<Tooltip content="Save changes" placement="top">
  <Button variant="secondary">Hover me</Button>
</Tooltip>`}
        render={() => (
          <Tooltip content="Save changes" placement="top">
            <Button variant="secondary">Hover me</Button>
          </Tooltip>
        )}
      />

      <VariantsGallery
        columns={4}
        items={PLACEMENTS.map((placement) => ({
          label: placement,
          render: () => (
            <Tooltip content={`Side: ${placement}`} placement={placement}>
              <Button variant="secondary">{placement}</Button>
            </Tooltip>
          ),
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'content',
            type: 'ReactNode',
            description: 'Label shown in the tooltip.',
          },
          {
            name: 'children',
            type: 'ReactNode',
            description:
              'The trigger element the tooltip describes, rendered as the trigger child.',
          },
          {
            name: 'placement',
            type: "'top' | 'bottom' | 'left' | 'right'",
            defaultValue: "'top'",
            description: 'Preferred side, passed to the content as data-side.',
          },
          {
            name: 'delayDuration',
            type: 'number',
            defaultValue: '200',
            description: 'Hover delay in milliseconds before the tooltip opens.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default TooltipPage;

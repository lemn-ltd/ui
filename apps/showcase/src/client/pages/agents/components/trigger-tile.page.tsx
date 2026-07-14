import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@lemn-ltd/showcase-kit';
import { type TriggerStatus, TriggerTile } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const STATUSES: readonly TriggerStatus[] = ['enabled', 'disabled', 'error'];

function TriggerTilePage(): ReactElement {
  return (
    <ComponentPage
      status="beta"
      summary="A trigger kind as a bordered tile: a leading glyph, a label and optional description, and a trailing status pill. Presentational — selection and activation are owned by the host."
      title="Trigger tile"
    >
      <ExampleBlock
        code={`<TriggerTile icon="pointer" label="Manual" status="enabled" />
<TriggerTile icon="code" label="API" status="enabled" />
<TriggerTile icon="plug" label="Webhook" status="error" />
<TriggerTile icon="radio" label="Repository event" status="disabled" />`}
        render={() => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <TriggerTile icon="pointer" label="Manual" status="enabled" />
            <TriggerTile icon="code" label="API" status="enabled" />
            <TriggerTile icon="plug" label="Webhook" status="error" />
            <TriggerTile icon="radio" label="Repository event" status="disabled" />
          </div>
        )}
      />

      <VariantsGallery
        items={[
          ...STATUSES.map((status) => ({
            label: status,
            render: () => <TriggerTile icon="clock" label="Schedule" status={status} />,
          })),
          {
            label: 'selected',
            render: () => <TriggerTile icon="pointer" label="Manual" selected status="enabled" />,
          },
          {
            label: 'with description',
            render: () => (
              <TriggerTile
                description="On push to main"
                icon="plug"
                label="Webhook"
                status="enabled"
              />
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'icon',
            type: 'IconName',
            description: 'Brand-neutral glyph for the trigger kind, chosen by the consumer.',
          },
          { name: 'label', type: 'string', description: 'The trigger name.' },
          {
            name: 'description',
            type: 'string',
            description: 'Optional secondary line under the label.',
          },
          {
            name: 'status',
            type: "'enabled' | 'disabled' | 'error'",
            description: 'Delivery state, written to data-status and shown as a trailing pill.',
          },
          {
            name: 'selected',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Marks the tile as the active selection in an authoring surface.',
          },
          {
            name: '...rest',
            type: 'HTMLAttributes<HTMLDivElement>',
            description: 'Native div props forwarded to the tile root.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default TriggerTilePage;

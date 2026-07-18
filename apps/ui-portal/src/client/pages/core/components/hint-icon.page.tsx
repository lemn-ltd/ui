import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@portal/catalog-kit';
import { HintIcon, type HintIconTone } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const TONES: readonly { tone: HintIconTone; icon: 'info' | 'triangle-alert'; label: string }[] = [
  { tone: 'neutral', icon: 'info', label: 'Derived from the linked tool and skill definitions.' },
  { tone: 'warn', icon: 'triangle-alert', label: 'Service-owned definitions are read-only.' },
];

function HintIconPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="An inline glyph that reveals a toned tooltip on hover or focus. It flags a constraint and explains it in one element; the warn tone tints both the glyph and the tooltip."
      title="Hint icon"
    >
      <ExampleBlock
        code={`<HintIcon
  tone="warn"
  icon="triangle-alert"
  label="Service-owned definitions are read-only."
/>`}
        render={() => (
          <HintIcon
            icon="triangle-alert"
            label="Service-owned definitions are read-only."
            tone="warn"
          />
        )}
      />

      <VariantsGallery
        columns={2}
        items={TONES.map(({ tone, icon, label }) => ({
          label: tone,
          render: () => <HintIcon icon={icon} label={label} tone={tone} />,
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'label',
            type: 'string',
            description: 'Tooltip text, also the trigger accessible name.',
          },
          {
            name: 'icon',
            type: 'IconName',
            description: 'Glyph shown as the trigger.',
          },
          {
            name: 'tone',
            type: "'neutral' | 'warn'",
            defaultValue: "'neutral'",
            description: 'Tints the glyph and the tooltip; warn signals a constraint.',
          },
          {
            name: 'size',
            type: 'IconSize',
            defaultValue: '14',
            description: 'Glyph size in pixels.',
          },
          {
            name: 'placement',
            type: "'top' | 'bottom' | 'left' | 'right'",
            defaultValue: "'top'",
            description: 'Preferred tooltip side.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default HintIconPage;

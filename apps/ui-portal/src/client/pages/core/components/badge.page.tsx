import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@portal/catalog-kit';
import { Badge, type BadgeTone } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const TONES: readonly BadgeTone[] = [
  'neutral',
  'accent',
  'accent2',
  'success',
  'warn',
  'danger',
  'info',
  'dim',
];

function BadgePage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A small status label. Eight tones map to data-tone; variant switches between a subtle label and a soft tonal fill; showDot prepends a leading status dot."
      title="Badge"
    >
      <ExampleBlock
        code={`<Badge tone="success">Active</Badge>
<Badge showDot tone="warn">Degraded</Badge>
<Badge showDot variant="soft" tone="info">Syncing</Badge>`}
        render={() => (
          <>
            <Badge tone="success">Active</Badge>
            <Badge showDot tone="warn">
              Degraded
            </Badge>
            <Badge showDot tone="info" variant="soft">
              Syncing
            </Badge>
          </>
        )}
      />

      <VariantsGallery
        items={TONES.map((tone) => ({
          label: tone,
          render: () => <Badge tone={tone}>{tone}</Badge>,
        }))}
      />

      <VariantsGallery
        items={TONES.map((tone) => ({
          label: `${tone} · dot`,
          render: () => (
            <Badge showDot tone={tone}>
              {tone}
            </Badge>
          ),
        }))}
      />

      <VariantsGallery
        items={TONES.map((tone) => ({
          label: `${tone} · soft`,
          render: () => (
            <Badge tone={tone} variant="soft">
              {tone}
            </Badge>
          ),
        }))}
      />

      <VariantsGallery
        items={TONES.map((tone) => ({
          label: `${tone} · soft · dot`,
          render: () => (
            <Badge showDot tone={tone} variant="soft">
              {tone}
            </Badge>
          ),
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'tone',
            type: "'neutral' | 'accent' | 'accent2' | 'success' | 'warn' | 'danger' | 'info' | 'dim'",
            defaultValue: "'neutral'",
            description: 'Semantic color, written to data-tone.',
          },
          {
            name: 'variant',
            type: "'subtle' | 'soft'",
            defaultValue: "'subtle'",
            description: "Emphasis. soft fills the badge with the tone's soft surface.",
          },
          {
            name: 'showDot',
            type: 'boolean',
            defaultValue: 'false',
            description: 'Prepends a leading status dot; written to data-dot.',
          },
          {
            name: '…rest',
            type: 'HTMLAttributes<HTMLSpanElement>',
            description: 'Native span props (className, title, …).',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default BadgePage;

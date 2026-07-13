import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { ProgressBar, type ProgressBarVariant } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const VARIANTS: readonly ProgressBarVariant[] = ['determinate', 'indeterminate', 'route'];

const DETERMINATE_VALUES: readonly number[] = [0, 25, 50, 75, 100];

function ProgressBarPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A linear progress indicator. Determinate carries ARIA and an optional label; the indeterminate and route loops run on the linear easing and go static under reduced motion."
      title="Progress bar"
    >
      <ExampleBlock
        code={`<ProgressBar variant="determinate" value={50} showLabel />
<ProgressBar variant="indeterminate" />`}
        render={() => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 320 }}>
            <ProgressBar showLabel value={50} variant="determinate" />
            <ProgressBar variant="indeterminate" />
          </div>
        )}
      />

      <VariantsGallery
        columns={1}
        items={VARIANTS.map((variant) => ({
          label: variant,
          render: () => (
            <div style={{ width: 280 }}>
              <ProgressBar value={variant === 'determinate' ? 60 : undefined} variant={variant} />
            </div>
          ),
        }))}
      />

      <VariantsGallery
        columns={1}
        items={DETERMINATE_VALUES.map((value) => ({
          label: `${value}%`,
          render: () => (
            <div style={{ width: 280 }}>
              <ProgressBar showLabel value={value} variant="determinate" />
            </div>
          ),
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'variant',
            type: "'determinate' | 'indeterminate' | 'route'",
            defaultValue: "'determinate'",
            description: 'Progress mode; written to data-variant. Only determinate reads value.',
          },
          {
            name: 'value',
            type: 'number',
            defaultValue: '0',
            description: 'Determinate percentage, clamped to 0–100.',
          },
          {
            name: 'showLabel',
            type: 'boolean',
            defaultValue: 'false',
            description: 'When determinate, renders the percent as a label.',
          },
          {
            name: '…rest',
            type: "Omit<HTMLAttributes<HTMLDivElement>, 'role'>",
            description: 'Native div props (className, style, …); role is owned by the component.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default ProgressBarPage;

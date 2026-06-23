import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { Spinner, type SpinnerSize } from '@appranks/ui';
import type { ReactElement } from 'react';

const SIZES: readonly SpinnerSize[] = ['sm', 'md', 'lg'];

function SpinnerPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="An indeterminate circular spinner with role=status. The ring is static under reduced motion. Three sizes map to data-size."
      title="Spinner"
    >
      <ExampleBlock code={`<Spinner size="md" />`} render={() => <Spinner size="md" />} />

      <VariantsGallery
        items={SIZES.map((size) => ({
          label: size,
          render: () => <Spinner size={size} />,
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'size',
            type: "'sm' | 'md' | 'lg'",
            defaultValue: "'md'",
            description: 'Ring size; written to data-size.',
          },
          {
            name: 'aria-label',
            type: 'string',
            defaultValue: "'Loading'",
            description: 'Accessible name for the status role.',
          },
          {
            name: '…rest',
            type: 'HTMLAttributes<HTMLDivElement>',
            description: 'Native div props (className, id, …).',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default SpinnerPage;

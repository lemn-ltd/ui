import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { Tag, type TagVariant } from '@appranks/ui';
import type { ReactElement } from 'react';

const VARIANTS: readonly TagVariant[] = ['default', 'accent', 'muted'];

function TagPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="An inline label for free-form metadata such as keywords or categories. Three variants map to data-variant."
      title="Tag"
    >
      <ExampleBlock
        code={`<Tag variant="default">frontend</Tag>
<Tag variant="accent">priority</Tag>
<Tag variant="muted">archived</Tag>`}
        render={() => (
          <>
            <Tag variant="default">frontend</Tag>
            <Tag variant="accent">priority</Tag>
            <Tag variant="muted">archived</Tag>
          </>
        )}
      />

      <VariantsGallery
        items={VARIANTS.map((variant) => ({
          label: variant,
          render: () => <Tag variant={variant}>{variant}</Tag>,
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'variant',
            type: "'default' | 'accent' | 'muted'",
            defaultValue: "'default'",
            description: 'Visual treatment, written to data-variant.',
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

export default TagPage;

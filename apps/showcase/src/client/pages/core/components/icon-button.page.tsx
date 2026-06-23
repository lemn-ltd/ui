import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { Icon, IconButton, type IconButtonVariant } from '@appranks/ui';
import type { ReactElement } from 'react';

const VARIANTS: readonly IconButtonVariant[] = ['ghost', 'ghost-danger', 'primary', 'default'];

function IconButtonPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A square, icon-only action. It requires an aria-label and renders an Icon child. Four variants map to data-variant."
      title="Icon button"
    >
      <ExampleBlock
        code={`<IconButton aria-label="Edit" variant="ghost">
  <Icon name="pencil" />
</IconButton>
<IconButton aria-label="Delete" variant="ghost-danger">
  <Icon name="trash-2" />
</IconButton>`}
        render={() => (
          <>
            <IconButton aria-label="Edit" variant="ghost">
              <Icon name="pencil" />
            </IconButton>
            <IconButton aria-label="Delete" variant="ghost-danger">
              <Icon name="trash-2" />
            </IconButton>
          </>
        )}
      />

      <VariantsGallery
        items={VARIANTS.map((variant) => ({
          label: variant,
          render: () => (
            <IconButton aria-label={`Settings (${variant})`} variant={variant}>
              <Icon name="settings" />
            </IconButton>
          ),
        }))}
      />

      <VariantsGallery
        items={VARIANTS.map((variant) => ({
          label: `${variant} · disabled`,
          render: () => (
            <IconButton aria-label={`Settings (${variant})`} disabled variant={variant}>
              <Icon name="settings" />
            </IconButton>
          ),
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'aria-label',
            type: 'string',
            description: 'Required accessible name; the button has no visible text.',
          },
          {
            name: 'children',
            type: 'ReactNode',
            description: 'The glyph to render, normally a single Icon.',
          },
          {
            name: 'variant',
            type: "'ghost' | 'ghost-danger' | 'primary' | 'default'",
            defaultValue: "'ghost'",
            description: 'Visual treatment, written to data-variant.',
          },
          {
            name: '…rest',
            type: 'ButtonHTMLAttributes<HTMLButtonElement>',
            description:
              'Native button props (disabled, onClick, type, …); type defaults to "button".',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default IconButtonPage;

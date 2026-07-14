import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@lemn-ltd/showcase-kit';
import { Button, type ButtonVariant } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';

const VARIANTS: readonly ButtonVariant[] = [
  'primary',
  'secondary',
  'ghost',
  'outline',
  'danger',
  'ghost-danger',
];

function ButtonPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A clickable action. Six variants map to data-variant; everything else is native button behavior."
      title="Button"
    >
      <ExampleBlock
        code={`<Button variant="primary">Save changes</Button>
<Button variant="secondary">Cancel</Button>`}
        render={() => (
          <>
            <Button variant="primary">Save changes</Button>
            <Button variant="secondary">Cancel</Button>
          </>
        )}
      />

      <VariantsGallery
        items={VARIANTS.map((variant) => ({
          label: variant,
          render: () => <Button variant={variant}>Button</Button>,
        }))}
      />

      <VariantsGallery
        items={VARIANTS.map((variant) => ({
          label: `${variant} · disabled`,
          render: () => (
            <Button disabled variant={variant}>
              Button
            </Button>
          ),
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'variant',
            type: "'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'ghost-danger'",
            defaultValue: "'primary'",
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

export default ButtonPage;

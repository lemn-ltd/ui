import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { Checkbox } from '@appranks/ui';
import { type ReactElement, useState } from 'react';

function CheckboxPage(): ReactElement {
  const [checked, setChecked] = useState(true);

  return (
    <ComponentPage
      status="stable"
      summary="A Radix checkbox with the package indicator. It supports checked, unchecked, and indeterminate states via data-state."
      title="Checkbox"
    >
      <ExampleBlock
        code={`const [checked, setChecked] = useState(true);

<Checkbox
  aria-label="Enable notifications"
  checked={checked}
  onCheckedChange={(next) => setChecked(next === true)}
/>`}
        render={() => (
          <Checkbox
            aria-label="Enable notifications"
            checked={checked}
            onCheckedChange={(next) => setChecked(next === true)}
          />
        )}
      />

      <VariantsGallery
        items={[
          {
            label: 'unchecked',
            render: () => <Checkbox aria-label="Unchecked" checked={false} />,
          },
          {
            label: 'checked',
            render: () => <Checkbox aria-label="Checked" checked={true} />,
          },
          {
            label: 'indeterminate',
            render: () => <Checkbox aria-label="Indeterminate" checked="indeterminate" />,
          },
          {
            label: 'disabled · unchecked',
            render: () => <Checkbox aria-label="Disabled unchecked" checked={false} disabled />,
          },
          {
            label: 'disabled · checked',
            render: () => <Checkbox aria-label="Disabled checked" checked={true} disabled />,
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'checked',
            type: "boolean | 'indeterminate'",
            description: 'Controlled checked state; "indeterminate" shows the minus glyph.',
          },
          {
            name: 'onCheckedChange',
            type: "(checked: boolean | 'indeterminate') => void",
            description: 'Called when the user toggles the checkbox.',
          },
          {
            name: '…rest',
            type: 'Radix Checkbox.Root props',
            description:
              'Native and Radix props (disabled, defaultChecked, name, value, required, …).',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default CheckboxPage;

import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { Toggle } from '@appranks/ui';
import { type ReactElement, useState } from 'react';

function TogglePage(): ReactElement {
  const [checked, setChecked] = useState(true);

  return (
    <ComponentPage
      status="stable"
      summary="A Radix switch with a sliding thumb. It represents an on/off setting that takes effect immediately."
      title="Toggle"
    >
      <ExampleBlock
        code={`const [checked, setChecked] = useState(true);

<Toggle
  aria-label="Enable telemetry"
  checked={checked}
  onCheckedChange={setChecked}
/>`}
        render={() => (
          <Toggle aria-label="Enable telemetry" checked={checked} onCheckedChange={setChecked} />
        )}
      />

      <VariantsGallery
        items={[
          {
            label: 'off',
            render: () => <Toggle aria-label="Off" checked={false} />,
          },
          {
            label: 'on',
            render: () => <Toggle aria-label="On" checked={true} />,
          },
          {
            label: 'disabled · off',
            render: () => <Toggle aria-label="Disabled off" checked={false} disabled />,
          },
          {
            label: 'disabled · on',
            render: () => <Toggle aria-label="Disabled on" checked={true} disabled />,
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'checked',
            type: 'boolean',
            description: 'Controlled on/off state.',
          },
          {
            name: 'onCheckedChange',
            type: '(checked: boolean) => void',
            description: 'Called when the user flips the switch.',
          },
          {
            name: '…rest',
            type: 'Radix Switch.Root props',
            description:
              'Native and Radix props (disabled, defaultChecked, name, value, required, …).',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default TogglePage;

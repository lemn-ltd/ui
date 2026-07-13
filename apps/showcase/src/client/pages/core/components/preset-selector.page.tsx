import { ComponentPage, ExampleBlock, PropsTable } from '@appranks/showcase-kit';
import { PresetSelector } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';

const PRESETS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'mine', label: 'Mine' },
  { value: 'archived', label: 'Archived' },
] as const;

function PresetSelectorPage(): ReactElement {
  const [value, setValue] = useState<string>('active');
  const [managed, setManaged] = useState<string>('all');

  return (
    <ComponentPage
      status="stable"
      summary="A compact segmented control for picking a saved preset. The active segment writes data-active; an optional manage affordance trails the segments."
      title="Preset selector"
    >
      <ExampleBlock
        code={`const [value, setValue] = useState('active');

<PresetSelector
  presets={presets}
  value={value}
  onSelect={setValue}
/>`}
        render={() => <PresetSelector onSelect={setValue} presets={PRESETS} value={value} />}
      />

      <ExampleBlock
        code={`<PresetSelector
  presets={presets}
  value={value}
  onSelect={setValue}
  onManage={() => openManager()}
/>`}
        render={() => (
          <PresetSelector
            onManage={() => undefined}
            onSelect={setManaged}
            presets={PRESETS}
            value={managed}
          />
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'presets',
            type: 'readonly PresetOption[]',
            description: 'Segments to render, each with a value and a label.',
          },
          {
            name: 'value',
            type: 'string',
            description: 'Currently selected preset value; the component is controlled.',
          },
          {
            name: 'onSelect',
            type: '(value: string) => void',
            description: 'Fired with the chosen preset value.',
          },
          {
            name: 'onManage',
            type: '() => void',
            description: 'When set, renders a trailing manage control.',
          },
          {
            name: 'manageLabel',
            type: 'string',
            defaultValue: "'Manage presets'",
            description: 'Accessible name for the manage control.',
          },
          {
            name: 'className',
            type: 'string',
            description: 'Extra class names appended to the root.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default PresetSelectorPage;

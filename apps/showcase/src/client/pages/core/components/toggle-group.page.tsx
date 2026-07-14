import { ToggleGroup } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';
import { CapabilityDocs } from './capability-docs.js';

const ITEMS = [
  { value: 'bold', label: 'Bold' },
  { value: 'italic', label: 'Italic' },
  { value: 'code', label: 'Code' },
] as const;

const CODE = `import { ToggleGroup } from '@lemn-ltd/ui';

<ToggleGroup
  aria-label="Formatting"
  defaultValue={['bold']}
  items={items}
  type="multiple"
/>`;

function ToggleGroupExample(): ReactElement {
  const [value, setValue] = useState<string[]>(['bold']);
  return (
    <ToggleGroup
      aria-label="Formatting"
      items={ITEMS}
      onValueChange={setValue}
      type="multiple"
      value={value}
    />
  );
}

function ToggleGroupPage(): ReactElement {
  return (
    <CapabilityDocs
      apiRows={[
        { prop: 'type', type: "'single' | 'multiple'", description: 'Discriminates scalar and array state contracts.' },
        { prop: 'items', type: 'readonly ToggleGroupItem[]', description: 'Accessible toggle commands.' },
        { prop: 'value / defaultValue', type: 'string | readonly string[]', description: 'Controlled or initial selection matching type.' },
        { prop: 'orientation', type: "'horizontal' | 'vertical'", defaultValue: "'horizontal'", description: 'Roving-focus axis.' },
      ]}
      category="Inputs"
      code={CODE}
      componentName="ToggleGroup"
      render={() => <ToggleGroupExample />}
      summary="Group compact single- or multi-select commands without confusing them with switches or tabs."
      title="Toggle group"
    />
  );
}

export default ToggleGroupPage;

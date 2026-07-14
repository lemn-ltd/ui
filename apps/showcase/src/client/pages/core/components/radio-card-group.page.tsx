import { Icon, RadioCardGroup } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';
import { CapabilityDocs, CAPABILITY_PREVIEW_STYLE } from './capability-docs.js';

const CODE = `import { RadioCardGroup } from '@lemn-ltd/ui';

<RadioCardGroup
  aria-label="Delivery cadence"
  defaultValue="daily"
  options={cadenceOptions}
/>`;

function RadioCardExample(): ReactElement {
  const [value, setValue] = useState('daily');
  return (
    <div style={CAPABILITY_PREVIEW_STYLE}>
      <RadioCardGroup
        aria-label="Delivery cadence"
        onValueChange={setValue}
        options={[
          { value: 'daily', label: 'Daily digest', description: 'Delivered every morning.', icon: <Icon name="clock" /> },
          { value: 'weekly', label: 'Weekly summary', description: 'Delivered every Monday.', icon: <Icon name="refresh" /> },
        ]}
        orientation="horizontal"
        value={value}
      />
    </div>
  );
}

function RadioCardGroupPage(): ReactElement {
  return (
    <CapabilityDocs
      apiRows={[
        { prop: 'options', type: 'readonly RadioCardOption[]', description: 'Value, label, description, icon, and disabled state.' },
        { prop: 'value / defaultValue', type: 'string', description: 'Controlled or initial selected card.' },
        { prop: 'onValueChange', type: '(value: string) => void', description: 'Reports the selected option.' },
        { prop: 'orientation', type: "'horizontal' | 'vertical'", defaultValue: "'vertical'", description: 'Card layout and Radix navigation axis.' },
      ]}
      category="Inputs"
      code={CODE}
      componentName="RadioCardGroup"
      render={() => <RadioCardExample />}
      summary="Make one visually rich choice while preserving radio semantics and keyboard behavior."
      title="Radio card group"
    />
  );
}

export default RadioCardGroupPage;

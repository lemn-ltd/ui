import { Slider } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';
import { CapabilityDocs, CAPABILITY_PREVIEW_STYLE } from './capability-docs.js';

const CODE = `import { Slider } from '@lemn-ltd/ui';

<Slider
  aria-labels={['Minimum score', 'Maximum score']}
  defaultValue={[25, 80]}
  valueFormatter={(value) => \`\${value}%\`}
/>`;

function SliderExample(): ReactElement {
  const [value, setValue] = useState([25, 80]);
  return (
    <div style={CAPABILITY_PREVIEW_STYLE}>
      <Slider
        aria-labels={['Minimum score', 'Maximum score']}
        onValueChange={setValue}
        value={value}
        valueFormatter={(next) => `${next}%`}
      />
    </div>
  );
}

function SliderPage(): ReactElement {
  return (
    <CapabilityDocs
      apiRows={[
        { prop: 'value / defaultValue', type: 'readonly number[]', description: 'One or two numeric thumb values.' },
        { prop: 'aria-labels', type: '[string] | [string, string]', description: 'Required accessible label per thumb.' },
        { prop: 'min / max / step', type: 'number', defaultValue: '0 / 100 / 1', description: 'Numeric range and increment.' },
        { prop: 'valueFormatter', type: '(value, index) => ReactNode', description: 'Formats visible and assistive text without changing values.' },
      ]}
      category="Inputs"
      code={CODE}
      componentName="Slider"
      render={() => <SliderExample />}
      summary="Choose one bounded number or a two-thumb range with explicit accessible names."
      title="Slider"
    />
  );
}

export default SliderPage;

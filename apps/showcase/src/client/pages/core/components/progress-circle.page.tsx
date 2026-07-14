import { ProgressCircle } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { VisualizationDocs } from './visualization-docs.js';

const CODE = `import { ProgressCircle } from '@lemn-ltd/ui';

<ProgressCircle
  aria-label="Upload progress"
  label="72%"
  value={72}
/>`;

function ProgressCirclePage(): ReactElement {
  return (
    <VisualizationDocs
      apiRows={[
        { prop: 'value', type: 'number', description: 'Determinate value; omit for indeterminate progress.' },
        { prop: 'max', type: 'number', defaultValue: '100', description: 'Upper bound for determinate progress.' },
        { prop: 'label', type: 'ReactNode', description: 'Optional centered visual label.' },
        { prop: 'size / strokeWidth', type: 'number', defaultValue: '64 / 6', description: 'Native SVG geometry.' },
      ]}
      code={CODE}
      componentName="ProgressCircle"
      render={() => (
        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center' }}>
          <ProgressCircle aria-label="Upload progress" label="72%" value={72} />
          <ProgressCircle aria-label="Processing" />
        </div>
      )}
      summary="Represent determinate or indeterminate progress with native SVG and reduced-motion behavior."
      title="Progress circle"
    />
  );
}

export default ProgressCirclePage;

import { Separator } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { CapabilityDocs, CAPABILITY_PREVIEW_STYLE } from './capability-docs.js';

const CODE = `import { Separator } from '@lemn-ltd/ui';

<div className="toolbar">
  <span>Filters</span>
  <Separator decorative={false} orientation="vertical" />
  <span>Sort</span>
</div>`;

function SeparatorPage(): ReactElement {
  return (
    <CapabilityDocs
      apiRows={[
        { prop: 'orientation', type: "'horizontal' | 'vertical'", defaultValue: "'horizontal'", description: 'Visual and semantic axis.' },
        { prop: 'decorative', type: 'boolean', defaultValue: 'true', description: 'Uses presentation semantics unless the division is meaningful.' },
        { prop: 'className', type: 'string', description: 'Additional styling hook without implicit layout.' },
      ]}
      category="Layout"
      code={CODE}
      componentName="Separator"
      render={() => (
        <div style={CAPABILITY_PREVIEW_STYLE}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', height: 40 }}>
            <span>Filters</span>
            <Separator decorative={false} orientation="vertical" />
            <span>Sort</span>
          </div>
          <Separator />
        </div>
      )}
      summary="Separate content visually by default or expose a meaningful document division explicitly."
      title="Separator"
    />
  );
}

export default SeparatorPage;

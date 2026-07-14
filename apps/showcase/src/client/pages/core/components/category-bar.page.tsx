import { CategoryBar } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { trafficSources } from '../../../fixtures/index.js';
import { VisualizationDocs, VISUALIZATION_PREVIEW_STYLE } from './visualization-docs.js';

const CODE = `import { CategoryBar } from '@lemn-ltd/ui';

<CategoryBar
  aria-label="Traffic distribution"
  items={trafficSources}
/>`;

function CategoryBarPage(): ReactElement {
  return (
    <VisualizationDocs
      apiRows={[
        { prop: 'items', type: 'readonly CategoryBarItem[]', description: 'Labelled segment values and optional token colors.' },
        { prop: 'showLegend', type: 'boolean', defaultValue: 'true', description: 'Shows labels and values beneath the bar.' },
        { prop: 'valueFormatter', type: '(value: number) => string', description: 'Formats every visible segment value.' },
        { prop: 'emptyMessage', type: 'string', description: 'Message for an empty or zero-total dataset.' },
      ]}
      code={CODE}
      componentName="CategoryBar"
      render={() => (
        <div style={VISUALIZATION_PREVIEW_STYLE}>
          <CategoryBar aria-label="Traffic distribution" items={trafficSources} />
        </div>
      )}
      summary="Show a part-to-whole distribution with native layout, visible labels, and shape cues beyond color."
      title="Category bar"
    />
  );
}

export default CategoryBarPage;

import { BarList } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { reportCategories } from '../../../fixtures/index.js';
import { VisualizationDocs, VISUALIZATION_PREVIEW_STYLE } from './visualization-docs.js';

const CODE = `import { BarList } from '@lemn-ltd/ui';

<BarList
  aria-label="Report views"
  items={reportCategories}
  valueFormatter={(value) => value.toLocaleString()}
/>`;

function BarListPage(): ReactElement {
  return (
    <VisualizationDocs
      apiRows={[
        { prop: 'items', type: 'readonly BarListItem[]', description: 'Label, value, and optional link or action for each row.' },
        { prop: 'valueFormatter', type: '(value: number) => string', description: 'Formats the visible value.' },
        { prop: 'loading / error', type: 'boolean / string', description: 'Engine-independent report states.' },
        { prop: 'aria-label / aria-labelledby', type: 'string', description: 'Required accessible list name.' },
      ]}
      code={CODE}
      componentName="BarList"
      render={() => (
        <div style={VISUALIZATION_PREVIEW_STYLE}>
          <BarList aria-label="Report views" items={reportCategories} />
        </div>
      )}
      summary="Rank categories with readable values and CSS bars, using real links or buttons when rows are interactive."
      title="Bar list"
    />
  );
}

export default BarListPage;

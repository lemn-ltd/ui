import { Tracker } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { runStates } from '../../../fixtures/index.js';
import { VisualizationDocs, VISUALIZATION_PREVIEW_STYLE } from './visualization-docs.js';

const CODE = `import { Tracker } from '@lemn-ltd/ui';

<Tracker
  aria-label="Run lifecycle"
  items={runStates}
/>`;

function TrackerPage(): ReactElement {
  return (
    <VisualizationDocs
      apiRows={[
        { prop: 'items', type: 'readonly TrackerItem[]', description: 'Ordered labels, statuses, and optional descriptions.' },
        { prop: 'items[].status', type: "'complete' | 'active' | 'pending' | 'error'", description: 'Text-backed discrete status.' },
        { prop: 'aria-label / aria-labelledby', type: 'string', description: 'Required accessible sequence name.' },
        { prop: 'className', type: 'string', description: 'Additional class names applied to the ordered list.' },
      ]}
      code={CODE}
      componentName="Tracker"
      render={() => (
        <div style={VISUALIZATION_PREVIEW_STYLE}>
          <Tracker aria-label="Run lifecycle" items={runStates} />
        </div>
      )}
      summary="Summarize a discrete sequence of states using patterns and hidden text as well as color."
      title="Tracker"
    />
  );
}

export default TrackerPage;

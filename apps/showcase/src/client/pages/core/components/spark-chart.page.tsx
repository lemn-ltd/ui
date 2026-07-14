import { SparkChart } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { monthlyReportData } from '../../../fixtures/index.js';
import { VisualizationDocs, VISUALIZATION_PREVIEW_STYLE } from './visualization-docs.js';

const CODE = `import { SparkChart } from '@lemn-ltd/ui';

<SparkChart
  aria-label="Monthly revenue trend"
  data={monthlyReportData}
  dataKey="revenue"
  index="month"
  kind="area"
  name="Revenue"
/>`;

function SparkChartPage(): ReactElement {
  return (
    <VisualizationDocs
      apiRows={[
        { prop: 'kind', type: "'line' | 'area' | 'bar'", defaultValue: "'line'", description: 'Approved compact geometry.' },
        { prop: 'dataKey', type: 'keyof TDatum', description: 'Numeric value field.' },
        { prop: 'index', type: 'keyof TDatum', description: 'Tooltip label field.' },
        { prop: 'height', type: 'number', defaultValue: '96', description: 'Stable compact height.' },
      ]}
      code={CODE}
      componentName="SparkChart"
      render={() => (
        <div style={VISUALIZATION_PREVIEW_STYLE}>
          <SparkChart
            animation="none"
            aria-label="Monthly revenue trend"
            data={monthlyReportData}
            dataKey="revenue"
            index="month"
            kind="area"
            name="Revenue"
          />
        </div>
      )}
      summary="Add optional tooltip interaction to a compact line, area, or bar report visualization."
      title="Spark chart"
    />
  );
}

export default SparkChartPage;

import { BarChart } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { monthlyReportData } from '../../../fixtures/index.js';
import { VisualizationDocs, VISUALIZATION_PREVIEW_STYLE } from './visualization-docs.js';

const CODE = `import { BarChart } from '@lemn-ltd/ui';

<BarChart
  aria-label="Revenue and expenses by month"
  data={monthlyReportData}
  index="month"
  series={[
    { dataKey: 'revenue', name: 'Revenue' },
    { dataKey: 'expenses', name: 'Expenses' },
  ]}
/>`;

function BarChartPage(): ReactElement {
  return (
    <VisualizationDocs
      apiRows={[
        { prop: 'orientation', type: "'vertical' | 'horizontal'", defaultValue: "'vertical'", description: 'Direction of the rendered bars.' },
        { prop: 'stacked', type: 'boolean', defaultValue: 'false', description: 'Stacks series instead of grouping them.' },
        { prop: 'showLabels', type: 'boolean', defaultValue: 'false', description: 'Adds value labels when the layout has enough room.' },
        { prop: 'series', type: 'readonly ChartSeries<TDatum>[]', description: 'Named numeric series.' },
      ]}
      code={CODE}
      componentName="BarChart"
      render={() => (
        <div style={VISUALIZATION_PREVIEW_STYLE}>
          <BarChart
            animation="none"
            aria-label="Revenue and expenses by month"
            data={monthlyReportData}
            index="month"
            series={[{ dataKey: 'revenue', name: 'Revenue' }, { dataKey: 'expenses', name: 'Expenses' }]}
          />
        </div>
      )}
      summary="Compare categorical values as grouped or stacked bars in vertical or horizontal layouts."
      title="Bar chart"
    />
  );
}

export default BarChartPage;

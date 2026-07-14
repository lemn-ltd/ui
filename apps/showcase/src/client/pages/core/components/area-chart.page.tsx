import { AreaChart } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { monthlyReportData } from '../../../fixtures/index.js';
import { VisualizationDocs, VISUALIZATION_PREVIEW_STYLE } from './visualization-docs.js';

const CODE = `import { AreaChart } from '@lemn-ltd/ui';

<AreaChart
  aria-label="Revenue and expenses by month"
  data={monthlyReportData}
  index="month"
  series={[
    { dataKey: 'revenue', name: 'Revenue' },
    { dataKey: 'expenses', name: 'Expenses' },
  ]}
  stacked
/>`;

function AreaChartPage(): ReactElement {
  return (
    <VisualizationDocs
      apiRows={[
        { prop: 'data', type: 'readonly TDatum[]', description: 'Prepared chart rows.' },
        { prop: 'series', type: 'readonly ChartSeries<TDatum>[]', description: 'Named area series.' },
        { prop: 'stacked', type: 'boolean', defaultValue: 'false', description: 'Stacks the declared series.' },
        { prop: 'fill', type: "'solid' | 'gradient'", defaultValue: "'gradient'", description: 'Token-driven area fill.' },
        { prop: 'animation', type: "'auto' | 'none'", defaultValue: "'auto'", description: 'Disables motion for dense or reduced-motion contexts.' },
      ]}
      code={CODE}
      componentName="AreaChart"
      render={() => (
        <div style={VISUALIZATION_PREVIEW_STYLE}>
          <AreaChart
            animation="none"
            aria-label="Revenue and expenses by month"
            data={monthlyReportData}
            index="month"
            series={[{ dataKey: 'revenue', name: 'Revenue' }, { dataKey: 'expenses', name: 'Expenses' }]}
            stacked
          />
        </div>
      )}
      summary="Show the magnitude of one or more normal or stacked series over an ordered dimension."
      title="Area chart"
    />
  );
}

export default AreaChartPage;

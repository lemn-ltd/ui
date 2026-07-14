import { ComboChart } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { monthlyReportData } from '../../../fixtures/index.js';
import { VisualizationDocs, VISUALIZATION_PREVIEW_STYLE } from './visualization-docs.js';

const CODE = `import { ComboChart } from '@lemn-ltd/ui';

<ComboChart
  aria-label="Revenue and conversion by month"
  data={monthlyReportData}
  index="month"
  series={[
    { dataKey: 'revenue', kind: 'bar', name: 'Revenue' },
    { axis: 'secondary', dataKey: 'conversion', kind: 'line', name: 'Conversion' },
  ]}
/>`;

function ComboChartPage(): ReactElement {
  return (
    <VisualizationDocs
      apiRows={[
        { prop: 'series', type: 'readonly ComboChartSeries<TDatum>[]', description: 'Bar or line series declared through Lemn UI types.' },
        { prop: 'series[].kind', type: "'bar' | 'line'", description: 'Selects one approved geometry.' },
        { prop: 'series[].axis', type: "'primary' | 'secondary'", defaultValue: "'primary'", description: 'Opts a series into the secondary axis.' },
        { prop: 'showLegend', type: 'boolean', defaultValue: 'true', description: 'Shows keyboard-operable series controls.' },
      ]}
      code={CODE}
      componentName="ComboChart"
      render={() => (
        <div style={VISUALIZATION_PREVIEW_STYLE}>
          <ComboChart
            animation="none"
            aria-label="Revenue and conversion by month"
            data={monthlyReportData}
            index="month"
            series={[{ dataKey: 'revenue', kind: 'bar', name: 'Revenue' }, { axis: 'secondary', dataKey: 'conversion', kind: 'line', name: 'Conversion' }]}
          />
        </div>
      )}
      summary="Combine approved bar and line series while keeping one unified legend and tooltip."
      title="Combo chart"
    />
  );
}

export default ComboChartPage;

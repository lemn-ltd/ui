import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BarChart } from '../bar-chart.js';

describe('BarChart', () => {
  afterEach(() => cleanup());

  it('reports horizontal stacked semantics', () => {
    const { getByText } = render(
      <BarChart
        aria-label="Requests"
        data={[{ route: '/v1', success: 12, failure: -2 }]}
        index="route"
        orientation="horizontal"
        series={[{ dataKey: 'success', name: 'Success' }, { dataKey: 'failure', name: 'Failure' }]}
        stacked
      />,
    );
    expect(getByText(/2 stacked horizontal bar series/)).toBeTruthy();
  });
});

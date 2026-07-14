import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ComboChart } from '../combo-chart.js';

describe('ComboChart', () => {
  afterEach(() => cleanup());

  it('summarizes declared bars and lines', () => {
    const { getByText } = render(
      <ComboChart
        aria-label="Volume and conversion"
        data={[{ month: 'Jan', volume: 12, conversion: 0.42 }]}
        index="month"
        series={[
          { dataKey: 'volume', kind: 'bar', name: 'Volume' },
          { axis: 'secondary', dataKey: 'conversion', kind: 'line', name: 'Conversion' },
        ]}
      />,
    );
    expect(getByText(/combining 1 bar and 1 line series/)).toBeTruthy();
  });
});

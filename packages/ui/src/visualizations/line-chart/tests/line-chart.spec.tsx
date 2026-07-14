import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LineChart } from '../line-chart.js';

const data = [{ month: 'Jan', revenue: 12 }, { month: 'Feb', revenue: 18 }];

describe('LineChart', () => {
  afterEach(() => cleanup());

  it('renders an accessible summary and toggleable legend', () => {
    const { getByRole, getByText } = render(
      <LineChart aria-label="Revenue trend" data={data} index="month" series={[{ dataKey: 'revenue', name: 'Revenue' }]} />,
    );
    expect(getByRole('region', { name: 'Revenue trend' })).toBeTruthy();
    expect(getByText(/2 data points across 1 line series/)).toBeTruthy();
    const legend = getByRole('button', { name: 'Revenue' });
    fireEvent.click(legend);
    expect(legend.getAttribute('aria-pressed')).toBe('false');
  });

  it('renders an explicit empty state', () => {
    const { getByRole } = render(
      <LineChart aria-label="Revenue trend" data={[]} index="month" series={[{ dataKey: 'revenue', name: 'Revenue' }]} />,
    );
    expect(getByRole('status').textContent).toContain('No data available');
  });
});

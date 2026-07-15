import { render, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { HeatmapChart } from '../heatmap-chart.js';

const setOption = vi.fn();
const resize = vi.fn();
const dispose = vi.fn();

vi.mock('echarts', () => ({
  init: vi.fn(() => ({
    dispose,
    on: vi.fn(),
    resize,
    setOption,
  })),
}));

const data = [
  { value: 4, x: 'Monday', y: 'Morning' },
  { value: 9, x: 'Tuesday', y: 'Morning' },
] as const;

describe('HeatmapChart', () => {
  it('ships an SSR-readable data table before the provider hydrates', () => {
    const html = renderToString(<HeatmapChart aria-label="Visits" data={data} />);
    expect(html).toContain('<caption>Visits</caption>');
    expect(html).toContain('Monday');
    expect(html).toContain('Morning');
  });

  it('hydrates the ECharts provider with semantic token options', async () => {
    render(<HeatmapChart aria-label="Visits" data={data} />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const option = setOption.mock.calls.at(-1)?.[0] as { series?: Array<{ type?: string }> };
    expect(option.series?.[0]?.type).toBe('heatmap');
  });

  it('uses the common explicit empty state', () => {
    const { getByRole } = render(<HeatmapChart aria-label="Visits" data={[]} />);
    expect(getByRole('status').textContent).toContain('No data available');
  });
});

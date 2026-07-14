import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DonutChart } from '../donut-chart.js';

describe('DonutChart', () => {
  afterEach(() => cleanup());

  it('renders labelled segments and an optional center label', () => {
    const { getByText } = render(
      <DonutChart aria-label="Traffic sources" centerLabel="100" data={[{ label: 'Direct', value: 60 }, { label: 'Search', value: 40 }]} />,
    );
    expect(getByText('Direct')).toBeTruthy();
    expect(getByText('100')).toBeTruthy();
  });

  it('treats a zero total as an explicit empty state', () => {
    const { getByRole } = render(
      <DonutChart aria-label="Traffic sources" data={[{ label: 'Direct', value: 0 }]} />,
    );
    expect(getByRole('status').textContent).toContain('No non-zero data');
  });
});

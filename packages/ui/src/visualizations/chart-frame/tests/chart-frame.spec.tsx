import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChartFrame } from '../chart-frame.js';

describe('ChartFrame', () => {
  afterEach(() => cleanup());

  it('uses its title as the accessible region name', () => {
    const { getByRole } = render(<ChartFrame title="Revenue">Chart</ChartFrame>);
    expect(getByRole('region', { name: 'Revenue' })).toBeTruthy();
  });

  it('announces loading and empty states', () => {
    const { getByRole, rerender } = render(<ChartFrame aria-label="Revenue" loading />);
    expect(getByRole('status').textContent).toContain('Loading visualization');
    rerender(<ChartFrame aria-label="Revenue" empty emptyMessage="No revenue" />);
    expect(getByRole('status').textContent).toContain('No revenue');
  });

  it('offers retry for an error state', () => {
    const onRetry = vi.fn();
    const { getByRole } = render(
      <ChartFrame aria-label="Revenue" error="Could not load" onRetry={onRetry} />,
    );
    fireEvent.click(getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

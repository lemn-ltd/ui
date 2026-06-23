import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EmptyState } from '../empty-state.js';

describe('EmptyState', () => {
  afterEach(() => cleanup());

  it('defaults to the first-run intent', () => {
    const { container } = render(<EmptyState title="Nothing here" />);
    expect(container.querySelector('.ui-empty-state')?.getAttribute('data-intent')).toBe(
      'first-run',
    );
  });

  it('bakes the shared no-results copy without a default action', () => {
    const { container } = render(<EmptyState intent="no-results" />);
    expect(container.querySelector('.ui-empty-state')?.getAttribute('data-intent')).toBe(
      'no-results',
    );
    expect(container.querySelector('.ui-empty-state__title')?.textContent).toBe('No results');
    expect(container.querySelector('.ui-empty-state__description')?.textContent).toBe(
      'Try adjusting your search or filters',
    );
    expect(container.querySelector('.ui-empty-state__action')).toBeNull();
    expect(container.textContent).not.toContain('Clear filters');
  });

  it('renders the Clear filters button only when onClearFilters is provided', () => {
    const onClearFilters = vi.fn();
    const { getByText } = render(
      <EmptyState intent="no-results" onClearFilters={onClearFilters} />,
    );
    fireEvent.click(getByText('Clear filters'));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('treats an explicit action={null} as no action', () => {
    const { container } = render(
      <EmptyState action={null} intent="no-results" onClearFilters={vi.fn()} />,
    );
    expect(container.querySelector('.ui-empty-state__action')).toBeNull();
  });
});

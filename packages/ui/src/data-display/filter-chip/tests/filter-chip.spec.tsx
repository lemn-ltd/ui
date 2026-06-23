import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ActiveFiltersRow, FilterChip } from '../filter-chip.js';

describe('FilterChip', () => {
  afterEach(() => cleanup());

  it('renders the label and a remove control', () => {
    const onRemove = vi.fn();
    const { container } = render(<FilterChip label="Status: Active" onRemove={onRemove} />);
    expect(container.querySelector('.ui-filter-chip__label')?.textContent).toBe('Status: Active');
    fireEvent.click(container.querySelector('.ui-filter-chip__remove') as HTMLElement);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});

describe('ActiveFiltersRow', () => {
  afterEach(() => cleanup());

  it('lays every chip out in a single wrapping row container', () => {
    const { container } = render(
      <ActiveFiltersRow
        filters={[{ label: 'A' }, { label: 'B' }, { label: 'C' }, { label: 'D' }]}
        onClearAll={() => {}}
      />,
    );
    const row = container.querySelector('.ui-active-filters-row') as HTMLElement;
    const chips = row.querySelectorAll('.ui-filter-chip');
    // Every chip is a direct child of the same wrapping flex row, not split across rows.
    expect(chips).toHaveLength(4);
    for (const chip of chips) {
      expect(chip.parentElement).toBe(row);
    }
  });

  it('renders one chip per filter', () => {
    const { container } = render(<ActiveFiltersRow filters={[{ label: 'A' }, { label: 'B' }]} />);
    expect(container.querySelectorAll('.ui-filter-chip')).toHaveLength(2);
  });

  it('clears the applied set through Clear all', () => {
    const onClearAll = vi.fn();
    const { getByText } = render(
      <ActiveFiltersRow filters={[{ label: 'A' }]} onClearAll={onClearAll} />,
    );
    fireEvent.click(getByText('Clear all'));
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it('hides Clear all when there are no filters', () => {
    const { queryByText } = render(<ActiveFiltersRow filters={[]} onClearAll={() => {}} />);
    expect(queryByText('Clear all')).toBeNull();
  });
});

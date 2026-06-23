import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RecentChips } from '../recent-chips.js';

describe('RecentChips', () => {
  afterEach(() => cleanup());

  it('renders a muted tag per item under the label', () => {
    const { container } = render(
      <RecentChips
        items={[
          { id: 'a', label: 'Alpha' },
          { id: 'b', label: 'Beta' },
        ]}
        label="Recent"
      />,
    );
    expect(container.querySelector('.ui-recent-chips__label')?.textContent).toBe('Recent');
    const chips = container.querySelectorAll('.ui-recent-chips__chip');
    expect(chips).toHaveLength(2);
    expect(chips[0]?.getAttribute('data-variant')).toBe('muted');
  });

  it('selects an item by id', () => {
    const onSelect = vi.fn();
    const { getByText } = render(
      <RecentChips items={[{ id: 'a', label: 'Alpha' }]} label="Recent" onSelect={onSelect} />,
    );
    fireEvent.click(getByText('Alpha'));
    expect(onSelect).toHaveBeenCalledWith('a');
  });
});

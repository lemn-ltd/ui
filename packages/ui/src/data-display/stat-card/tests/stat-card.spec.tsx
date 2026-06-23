import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { StatCard, type StatDeltaDirection } from '../stat-card.js';

const DIRECTIONS: StatDeltaDirection[] = ['up', 'down', 'flat'];

describe('StatCard', () => {
  afterEach(() => cleanup());

  it('renders label and value', () => {
    const { container } = render(<StatCard label="Active" value="42" />);
    expect(container.querySelector('.ui-stat-card__label')?.textContent).toBe('Active');
    expect(container.querySelector('.ui-stat-card__value')?.textContent).toBe('42');
  });

  it('omits the delta slot when no delta is given', () => {
    const { container } = render(<StatCard label="Active" value="42" />);
    expect(container.querySelector('.ui-stat-card__delta')).toBeNull();
  });

  it('maps every delta direction to data-direction', () => {
    for (const direction of DIRECTIONS) {
      const { container, unmount } = render(
        <StatCard delta={{ direction, label: '+1' }} label="Active" value="42" />,
      );
      expect(container.querySelector('.ui-stat-card__delta')?.getAttribute('data-direction')).toBe(
        direction,
      );
      unmount();
    }
  });
});

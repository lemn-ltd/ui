import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { StatsStrip } from '../stats-strip.js';

describe('StatsStrip', () => {
  afterEach(() => cleanup());

  it('renders one StatCard cell per stat', () => {
    const { container } = render(
      <StatsStrip
        stats={[
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
          { label: 'C', value: '3' },
        ]}
      />,
    );
    expect(container.querySelectorAll('.ui-stats-strip__cell')).toHaveLength(3);
    expect(container.querySelectorAll('.ui-stat-card')).toHaveLength(3);
  });
});

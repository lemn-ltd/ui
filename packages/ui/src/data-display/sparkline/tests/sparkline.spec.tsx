import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Sparkline } from '../sparkline.js';

describe('Sparkline', () => {
  afterEach(() => cleanup());

  it('renders one bar per point', () => {
    const { container } = render(<Sparkline points={[1, 4, 2, 8]} />);
    expect(container.querySelectorAll('.ui-sparkline__bar')).toHaveLength(4);
  });

  it('scales bar heights to the series maximum', () => {
    const { container } = render(<Sparkline points={[0, 10]} />);
    const bars = container.querySelectorAll('.ui-sparkline__bar');
    expect((bars[1] as HTMLElement).style.height).toBe('100%');
    // Floor keeps a zero bar visible at the baseline.
    expect((bars[0] as HTMLElement).style.height).toBe('8%');
  });
});

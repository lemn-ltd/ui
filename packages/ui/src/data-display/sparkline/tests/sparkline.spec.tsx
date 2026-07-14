import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Sparkline } from '../sparkline.js';

describe('Sparkline', () => {
  afterEach(() => cleanup());

  it('renders one bar per point', () => {
    const { container } = render(<Sparkline aria-label="Revenue trend" points={[1, 4, 2, 8]} />);
    expect(container.querySelectorAll('.ui-sparkline__bar')).toHaveLength(4);
  });

  it('scales bar heights to the series maximum', () => {
    const { container } = render(<Sparkline aria-label="Revenue trend" points={[0, 10]} />);
    const bars = container.querySelectorAll('.ui-sparkline__bar');
    expect((bars[1] as HTMLElement).style.height).toBe('100%');
    // Floor keeps a zero bar visible at the baseline.
    expect((bars[0] as HTMLElement).style.height).toBe('8%');
  });

  it('renders an informative image only when it has an accessible name', () => {
    const { getByRole } = render(<Sparkline aria-label="Revenue trend" points={[1, 2, 3]} />);
    expect(getByRole('img', { name: 'Revenue trend' })).toBeTruthy();
  });

  it('removes informative semantics when explicitly decorative', () => {
    const { container, queryByRole } = render(<Sparkline decorative points={[1, 2, 3]} />);
    expect(queryByRole('img')).toBeNull();
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });
});

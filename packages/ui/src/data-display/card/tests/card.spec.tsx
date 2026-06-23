import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Card } from '../card.js';

describe('Card', () => {
  afterEach(() => cleanup());

  it('collapses absent optional slots', () => {
    const { container } = render(<Card>body</Card>);
    expect(container.querySelector('.ui-card__title')).toBeNull();
    expect(container.querySelector('.ui-card__footer')).toBeNull();
    expect(container.querySelector('.ui-card__body')?.textContent).toBe('body');
  });

  it('renders title and footer when provided', () => {
    const { container } = render(
      <Card footer="footer" title="title">
        body
      </Card>,
    );
    expect(container.querySelector('.ui-card__title')?.textContent).toBe('title');
    expect(container.querySelector('.ui-card__footer')?.textContent).toBe('footer');
  });

  it('flags elevation through data-elevated', () => {
    const { container } = render(<Card elevated>body</Card>);
    expect(container.querySelector('.ui-card')?.getAttribute('data-elevated')).toBe('true');
  });

  it('keeps the hover lift opt-in through data-interactive (off by default)', () => {
    const { container, rerender } = render(<Card>body</Card>);
    expect(container.querySelector('.ui-card')?.getAttribute('data-interactive')).toBe('false');

    rerender(<Card interactive>body</Card>);
    expect(container.querySelector('.ui-card')?.getAttribute('data-interactive')).toBe('true');
  });
});

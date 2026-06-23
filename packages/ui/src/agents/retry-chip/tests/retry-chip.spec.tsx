import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RetryChip } from '../retry-chip.js';

describe('RetryChip', () => {
  afterEach(() => cleanup());

  it('renders the attempt count, state, and optional note', () => {
    const { container } = render(
      <RetryChip attempt={2} label="in 1m" maxAttempts={5} state="scheduled" />,
    );
    const chip = container.querySelector('.ui-retry-chip');
    expect(chip?.getAttribute('data-retry-state')).toBe('scheduled');
    expect(container.querySelector('.ui-retry-chip__count')?.textContent).toBe('2/5');
    expect(container.querySelector('.ui-retry-chip__note')?.textContent).toBe('in 1m');
  });

  it('omits the note when none is given', () => {
    const { container } = render(<RetryChip attempt={3} maxAttempts={3} state="exhausted" />);
    expect(container.querySelector('.ui-retry-chip__note')).toBeNull();
  });
});

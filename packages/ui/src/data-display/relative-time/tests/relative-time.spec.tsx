import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { RelativeTime } from '../relative-time.js';

const NOW = new Date('2026-06-03T12:00:00.000Z').getTime();

describe('RelativeTime', () => {
  afterEach(() => cleanup());

  it('formats an hours-old timestamp', () => {
    const value = new Date(NOW - 2 * 60 * 60 * 1000).toISOString();
    const { container } = render(<RelativeTime now={NOW} value={value} />);
    expect(container.querySelector('.ui-relative-time')?.textContent).toBe('2h ago');
  });

  it('formats a future timestamp instead of collapsing it to now', () => {
    const value = new Date(NOW + 4 * 60 * 1000).toISOString();
    const { container } = render(<RelativeTime now={NOW} value={value} />);
    expect(container.querySelector('.ui-relative-time')?.textContent).toBe('in 4m');
  });

  it('writes the absolute timestamp into dateTime', () => {
    const value = new Date(NOW - 60 * 60 * 1000).toISOString();
    const { container } = render(<RelativeTime now={NOW} value={value} />);
    expect(container.querySelector('time')?.getAttribute('datetime')).toBe(value);
  });
});

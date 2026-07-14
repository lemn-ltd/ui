import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Separator } from '../separator.js';

describe('Separator', () => {
  afterEach(cleanup);

  it('is decorative and horizontal by default', () => {
    const { container } = render(<Separator />);
    const separator = container.firstElementChild;
    expect(separator?.getAttribute('role')).toBe('presentation');
    expect(separator?.getAttribute('aria-hidden')).toBe('true');
    expect(separator?.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('exposes semantic vertical orientation when requested', () => {
    const { getByRole } = render(<Separator decorative={false} orientation="vertical" />);
    expect(getByRole('separator').getAttribute('aria-orientation')).toBe('vertical');
  });
});

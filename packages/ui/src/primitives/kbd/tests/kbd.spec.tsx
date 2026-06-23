import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Kbd } from '../kbd.js';

describe('Kbd', () => {
  afterEach(() => cleanup());

  it('renders a kbd element with the base className and children', () => {
    const { container } = render(<Kbd>⌘K</Kbd>);
    const kbd = container.querySelector('kbd');
    expect(kbd).not.toBeNull();
    expect(kbd?.className).toContain('ui-kbd');
    expect(kbd?.textContent).toBe('⌘K');
  });
});

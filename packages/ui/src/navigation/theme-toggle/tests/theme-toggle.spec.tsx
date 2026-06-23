import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeToggle } from '../theme-toggle.js';

describe('ThemeToggle', () => {
  afterEach(() => cleanup());

  it('renders a labeled control and flips its label on click', () => {
    const { getByRole } = render(<ThemeToggle />);
    const button = getByRole('button');
    const initial = button.getAttribute('aria-label');
    expect(initial).toMatch(/Switch to (light|dark) theme/);
    fireEvent.click(button);
    expect(button.getAttribute('aria-label')).not.toBe(initial);
  });
});

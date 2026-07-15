import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeToggle } from '../theme-toggle.js';

describe('ThemeToggle', () => {
  afterEach(() => cleanup());

  it('renders the host-owned mode and requests the opposite mode', () => {
    const onModeChange = vi.fn();
    const { getByRole } = render(
      <ThemeToggle mode="light" onModeChange={onModeChange} />,
    );
    const button = getByRole('button', { name: 'Switch to dark theme' });
    fireEvent.click(button);
    expect(onModeChange).toHaveBeenCalledWith('dark');
  });

  it('does not mutate document state or local storage', () => {
    const onModeChange = vi.fn();
    const { getByRole } = render(
      <ThemeToggle mode="dark" onModeChange={onModeChange} />,
    );
    fireEvent.click(getByRole('button', { name: 'Switch to light theme' }));
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(window.localStorage.length).toBe(0);
  });
});

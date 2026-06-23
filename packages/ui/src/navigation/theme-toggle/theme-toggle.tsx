import { type ReactElement, useState } from 'react';
import { getResolvedTheme, setTheme } from '../../foundations/theme.js';
import { Icon, IconButton } from '../../primitives/index.js';

/**
 * Minimalist icon-only theme switch: a sun in light, a moon in dark. It owns the
 * theme runtime so any consumer gets a working light/dark toggle by dropping it in.
 */
export function ThemeToggle(): ReactElement {
  const [dark, setDark] = useState(() => getResolvedTheme() === 'dark');

  function toggle(): void {
    const next = !dark;
    setDark(next);
    setTheme(next ? 'dark' : 'light');
  }

  return (
    <IconButton
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggle}
      variant="ghost"
    >
      <Icon name={dark ? 'moon' : 'sun'} size={18} />
    </IconButton>
  );
}

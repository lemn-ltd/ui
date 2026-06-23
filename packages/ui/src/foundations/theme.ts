/**
 * Theme runtime: three modes resolved against the token cascade in
 * `tokens.css`.
 *
 * - `light` / `dark` write an explicit `data-theme` attribute on the target.
 * - `system` removes the attribute so the `prefers-color-scheme` media block
 *   governs the effective mode.
 *
 * Light is the default mode: with no attribute and no OS dark preference, the
 * `:root` Light defaults apply.
 */

export type ColorTheme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'color-theme';

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

function isColorTheme(value: unknown): value is ColorTheme {
  return value === 'light' || value === 'dark' || value === 'system';
}

/**
 * The explicit persisted choice, or `system` when none has been set.
 */
export function getTheme(): ColorTheme {
  if (typeof window === 'undefined' || !window.localStorage) return 'system';

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isColorTheme(stored) ? stored : 'system';
}

/**
 * Persist the choice and apply it to the document root.
 */
export function setTheme(theme: ColorTheme): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }

  applyTheme(theme);
}

/**
 * Write or clear the `data-theme` attribute on `target` (defaults to
 * `<html>`). `system` clears the attribute so the media block governs.
 */
export function applyTheme(theme: ColorTheme, target?: HTMLElement): void {
  if (typeof document === 'undefined') return;

  const root = target ?? document.documentElement;
  if (theme === 'system') {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = theme;
  }
}

/**
 * The effective concrete mode. Under `system`, the OS preference is read with
 * `matchMedia`; an explicit choice resolves to itself.
 */
export function getResolvedTheme(): 'light' | 'dark' {
  const theme = getTheme();
  if (theme !== 'system') return theme;

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia(DARK_SCHEME_QUERY).matches ? 'dark' : 'light';
}

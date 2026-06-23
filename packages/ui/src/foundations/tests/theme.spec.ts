import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { applyTheme, getResolvedTheme, getTheme, setTheme } from '../theme.js';

// localStorage is installed globally per-test by vitest.setup.ts.
beforeEach(() => {
  delete document.documentElement.dataset.theme;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('applyTheme', () => {
  it('writes an explicit dark attribute', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('writes an explicit light attribute', () => {
    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('clears the attribute under system so the media block governs', () => {
    applyTheme('dark');
    applyTheme('system');
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('targets a provided element instead of the document root', () => {
    const host = document.createElement('div');
    applyTheme('dark', host);
    expect(host.dataset.theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});

describe('getTheme', () => {
  it('defaults to system when nothing is persisted', () => {
    expect(getTheme()).toBe('system');
  });

  it('reads the persisted explicit choice', () => {
    setTheme('dark');
    expect(getTheme()).toBe('dark');
  });
});

describe('setTheme', () => {
  it('persists the choice and applies it', () => {
    setTheme('light');
    expect(window.localStorage.getItem('color-theme')).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});

describe('getResolvedTheme', () => {
  it('resolves an explicit choice to itself', () => {
    setTheme('dark');
    expect(getResolvedTheme()).toBe('dark');
  });

  it('defaults to light when no choice is set and the OS does not prefer dark', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
    expect(getResolvedTheme()).toBe('light');
  });

  it('resolves system to dark when the OS prefers dark', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    setTheme('system');
    expect(getResolvedTheme()).toBe('dark');
  });
});

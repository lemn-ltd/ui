import { expect, test as base } from '@playwright/test';

export type Theme = 'light' | 'dark';

/** The persisted theme key the package theme runtime reads on first mount. */
const THEME_STORAGE_KEY = 'color-theme';

function themeForProject(name: string): Theme {
  return name.includes('dark') ? 'dark' : 'light';
}

/**
 * Deterministic test base: every page boots in its project's theme, with reduced
 * motion forced so shimmer/spin/indeterminate loops are static and visual
 * baselines stay byte-stable. Theme is derived from the project name
 * (`behavior` and `visual-light-*` → light; `visual-dark-*` → dark).
 */
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const theme = themeForProject(testInfo.project.name);
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.addInitScript(
      ([key, value]) => {
        try {
          window.localStorage.setItem(key, value);
        } catch {
          // Storage can be unavailable in some contexts; the app falls back to light.
        }
      },
      [THEME_STORAGE_KEY, theme] as const,
    );
    await use(page);
  },
});

export { expect };

/**
 * Navigate and wait for the lazily-loaded page to resolve (its ContentLayout or
 * the not-found surface), plus fonts, so assertions and screenshots are stable.
 */
export async function gotoStable(
  page: import('@playwright/test').Page,
  path = '/',
): Promise<void> {
  await page.goto(path);
  await page.locator('.ui-content-layout, .showcase-not-found').first().waitFor();
  await page.evaluate(async () => {
    await document.fonts?.ready;
  });
}

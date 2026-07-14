import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const E2E_PORT_MIN = 20_000;
const E2E_PORT_SPAN = 20_000;

export function showcaseE2ePortForCheckout(checkoutPath: string): number {
  const digest = createHash('sha256').update(checkoutPath).digest();
  return E2E_PORT_MIN + (digest.readUInt16BE(0) % E2E_PORT_SPAN);
}

const SHOWCASE_ROOT = realpathSync(import.meta.dirname);
const E2E_PORT = showcaseE2ePortForCheckout(SHOWCASE_ROOT);
const BASE_URL = `http://127.0.0.1:${E2E_PORT}`;
const STATIC_PREVIEW = process.env.SHOWCASE_E2E_STATIC_PREVIEW === '1';

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 900 },
} as const;

const THEMES = ['light', 'dark'] as const;

const VISUAL_MATCH = /visual\.e2e\.ts/;

// Light/Dark x {375,768,1280} = 6 deterministic visual projects; the theme is
// applied per project by the deterministic test base (keyed off the name).
const visualProjects = THEMES.flatMap((theme) =>
  (Object.keys(VIEWPORTS) as (keyof typeof VIEWPORTS)[]).map((size) => ({
    name: `visual-${theme}-${size}`,
    testMatch: VISUAL_MATCH,
    use: {
      ...devices['Desktop Chrome'],
      viewport: VIEWPORTS[size],
      colorScheme: theme,
      deviceScaleFactor: 1,
    },
  })),
);

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/*.e2e.ts'],
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}-{platform}{ext}',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : [['html', { open: 'never' }]],
  timeout: 120_000,
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' },
  },
  webServer: {
    // The canonical command is Worker-backed; the pinned Linux baseline
    // generator alone opts into static preview. Both remain Playwright-owned.
    command: `pnpm exec vite ${STATIC_PREVIEW ? 'preview' : 'dev'} --host 127.0.0.1 --port ${E2E_PORT} --strictPort`,
    cwd: SHOWCASE_ROOT,
    url: BASE_URL,
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
    timeout: 120_000,
  },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: BASE_URL,
    permissions: ['clipboard-read', 'clipboard-write'],
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    deviceScaleFactor: 1,
  },
  projects: [
    {
      name: 'behavior',
      testIgnore: VISUAL_MATCH,
      use: {
        ...devices['Desktop Chrome'],
        viewport: VIEWPORTS.desktop,
        colorScheme: 'light',
        deviceScaleFactor: 1,
      },
    },
    ...visualProjects,
  ],
});

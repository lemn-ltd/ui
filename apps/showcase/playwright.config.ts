import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:6500';
const shouldStartLocalServer = process.env.BASE_URL === undefined;

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
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : [['html', { open: 'never' }]],
  timeout: 120_000,
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' },
  },
  webServer: shouldStartLocalServer
    ? {
        // Run the real Worker-backed dev server (Cloudflare Vite plugin) so the
        // lane exercises the deployable Worker, including the /health route.
        command: 'pnpm --filter @appranks/ui-showcase run dev',
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: BASE_URL,
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

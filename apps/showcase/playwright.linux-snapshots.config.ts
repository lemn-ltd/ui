import { defineConfig } from '@playwright/test';
import canonicalConfig from './playwright.config';

const rawBaseUrl = process.env.SHOWCASE_LINUX_SNAPSHOT_BASE_URL;
if (!rawBaseUrl) {
  throw new Error('SHOWCASE_LINUX_SNAPSHOT_BASE_URL is required');
}

const baseUrl = new URL(rawBaseUrl);
if (baseUrl.protocol !== 'http:') {
  throw new Error('SHOWCASE_LINUX_SNAPSHOT_BASE_URL must use http');
}

export default defineConfig({
  ...canonicalConfig,
  webServer: undefined,
  use: {
    ...canonicalConfig.use,
    baseURL: baseUrl.href.replace(/\/$/u, ''),
  },
});

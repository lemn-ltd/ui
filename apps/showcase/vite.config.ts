import { fileURLToPath } from 'node:url';
import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { uiShowcaseAppDescriptor } from './src/app-descriptor';

const localUiOnly = process.env.WEB_UI_LOCAL === '1';

const uiSrc = (relativePath: string): string =>
  fileURLToPath(new URL(`../../packages/ui/src/${relativePath}`, import.meta.url));
const showcaseKitSrc = (relativePath: string): string =>
  fileURLToPath(new URL(`../../packages/showcase-kit/src/${relativePath}`, import.meta.url));

export default defineConfig({
  server: {
    allowedHosts: ['local-ui.appranks.com'],
  },
  // The showcase consumes @appranks/ui from source so the catalog stays the
  // single visual source of truth without a rebuild on every change.
  resolve: {
    alias: [
      { find: '@appranks/ui/styles.css', replacement: uiSrc('styles.css') },
      { find: '@appranks/ui/catalog', replacement: uiSrc('catalog.ts') },
      { find: '@appranks/ui/tokens', replacement: uiSrc('tokens.ts') },
      { find: '@appranks/ui', replacement: uiSrc('index.ts') },
      {
        find: '@appranks/showcase-kit/styles.css',
        replacement: showcaseKitSrc('styles.css'),
      },
      { find: '@appranks/showcase-kit', replacement: showcaseKitSrc('index.ts') },
    ],
  },
  build: {
    outDir: 'dist/client',
    sourcemap: true,
  },
  plugins: [
    {
      name: 'appranks-ui-html',
      transformIndexHtml(html) {
        return html.replace(/%APP_NAME%/g, uiShowcaseAppDescriptor.displayName);
      },
    },
    react(),
    !localUiOnly && cloudflare({ inspectorPort: false }),
  ],
});

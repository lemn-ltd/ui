import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  plugins: [react()],
  resolve: {
    alias: {
      '@lemn-ltd/ui/styles.css': path.resolve(
        import.meta.dirname,
        '../../packages/ui/src/styles.css',
      ),
      '@lemn-ltd/ui/catalog': path.resolve(import.meta.dirname, '../../packages/ui/src/catalog.ts'),
      '@lemn-ltd/ui/tokens': path.resolve(
        import.meta.dirname,
        '../../packages/ui/src/tokens.ts',
      ),
      '@lemn-ltd/ui': path.resolve(import.meta.dirname, '../../packages/ui/src/index.ts'),
      '@lemn-ltd/showcase-kit/styles.css': path.resolve(
        import.meta.dirname,
        '../../packages/showcase-kit/src/styles.css',
      ),
      '@lemn-ltd/showcase-kit': path.resolve(
        import.meta.dirname,
        '../../packages/showcase-kit/src/index.ts',
      ),
      'cloudflare:workers': path.resolve(
        import.meta.dirname,
        'tests/fixtures/cloudflare-workers.ts',
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },
});

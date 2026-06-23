import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  plugins: [react()],
  resolve: {
    alias: {
      '@appranks/ui/styles.css': path.resolve(
        import.meta.dirname,
        '../../packages/ui/src/styles.css',
      ),
      '@appranks/ui/catalog': path.resolve(import.meta.dirname, '../../packages/ui/src/catalog.ts'),
      '@appranks/ui/tokens': path.resolve(
        import.meta.dirname,
        '../../packages/ui/src/tokens.ts',
      ),
      '@appranks/ui': path.resolve(import.meta.dirname, '../../packages/ui/src/index.ts'),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.spec.tsx', 'src/**/*.spec.ts'],
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },
});

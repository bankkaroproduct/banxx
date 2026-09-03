import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  // No @vitejs/plugin-react: its current major requires vite 8, which conflicts
  // with the vite <8 peer range that lovable-tagger pins. esbuild's automatic
  // JSX runtime covers what the tests need.
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});

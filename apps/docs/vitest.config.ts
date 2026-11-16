import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const registry = (path: string) =>
  fileURLToPath(new URL(`../../packages/registry/src/${path}`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\/components\/blocks\//, replacement: `${registry('blocks')}/` },
      { find: /^@\/components\/ui\//, replacement: `${registry('ui')}/` },
      { find: /^@\/lib\//, replacement: `${registry('lib')}/` },
      { find: /^@\/hooks\//, replacement: `${registry('hooks')}/` },
      { find: /^@\/test\//, replacement: `${registry('test')}/` },
    ],
    dedupe: ['react', 'react-dom'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['../../packages/registry/src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    testTimeout: 20_000,
  },
});

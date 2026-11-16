import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const src = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\/components\/blocks\//, replacement: `${src('blocks')}/` },
      { find: /^@\/components\/ui\//, replacement: `${src('ui')}/` },
      { find: /^@\/lib\//, replacement: `${src('lib')}/` },
      { find: /^@\/hooks\//, replacement: `${src('hooks')}/` },
      { find: /^@\/test\//, replacement: `${src('test')}/` },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts', 'registry/**/*.test.ts'],
    css: false,
    testTimeout: 15_000,
    restoreMocks: true,
  },
});

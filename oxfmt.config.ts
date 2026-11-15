import { defineConfig } from 'oxfmt';

export default defineConfig({
  printWidth: 100,
  singleQuote: true,
  sortTailwindcss: {},
  sortImports: { enabled: true, newlinesBetween: false },
  ignorePatterns: [
    '**/dist/**',
    'packages/registry/registry-out/**',
    'packages/cli/registry/**',
    'packages/tokens/css/**',
    'pnpm-lock.yaml',
  ],
});

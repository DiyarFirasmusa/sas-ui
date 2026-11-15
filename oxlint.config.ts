import { defineConfig } from 'oxlint';

export default defineConfig({
  ignorePatterns: ['**/dist/**', 'packages/registry/registry-out/**', 'packages/cli/registry/**', 'packages/tokens/css/**', '.scratch/**'],
  categories: { correctness: 'error', suspicious: 'warn', perf: 'warn' },
  rules: {
    curly: 'error',
    'typescript/no-explicit-any': 'error',
    'typescript/consistent-type-imports': 'warn',
    'eslint/max-lines': ['warn', { max: 500 }],
  },
});

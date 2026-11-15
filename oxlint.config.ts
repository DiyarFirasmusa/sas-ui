import { defineConfig } from 'oxlint';

export default defineConfig({
  ignorePatterns: [
    '**/dist/**',
    'packages/registry/registry-out/**',
    'packages/cli/registry/**',
    'packages/tokens/css/**',
    '.scratch/**',
  ],
  categories: { correctness: 'error', suspicious: 'warn', perf: 'warn' },
  rules: {
    curly: 'error',
    // Destructuring to drop a prop before spreading `...rest` is deliberate.
    'eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    'typescript/no-explicit-any': 'error',
    'typescript/consistent-type-imports': 'error',
    'eslint/max-lines': ['error', { max: 500 }],
    // Sequential awaits are deliberate in tests and in the CLI's ordered resolver.
    'eslint/no-await-in-loop': 'off',
    // Test helper components are clearer declared next to the test that uses them.
    'unicorn/consistent-function-scoping': 'off',
    // Targets ES2023, but the sources stay readable without toSorted churn.
    'unicorn/no-array-sort': 'off',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: { 'eslint/max-lines': 'off' },
    },
  ],
});

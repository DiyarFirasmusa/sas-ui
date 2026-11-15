import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { patchTsconfigPaths, patchViteConfig, setupAlias } from './alias-setup.ts';

const TSCONFIG = `{
  "compilerOptions": {
    /* Bundler mode */
    "moduleResolution": "bundler"
  },
  "include": ["src"]
}`;

describe('alias setup', () => {
  it('inserts paths once into a JSONC tsconfig and keeps comments', () => {
    const patched = patchTsconfigPaths(TSCONFIG, '@', 'src');
    expect(patched).toContain('"paths": { "@/*": ["./src/*"] },');
    expect(patched).toContain('/* Bundler mode */');
    expect(patchTsconfigPaths(patched ?? '', '@', 'src')).toBeUndefined();
  });

  it('leaves a tsconfig with other paths alone', () => {
    expect(patchTsconfigPaths('{"compilerOptions":{"paths":{"~/*":["x"]}}}', '@', 'src')).toBeUndefined();
  });

  it('adds tsconfigPaths to a vite config exactly once', () => {
    const config = `export default defineConfig({\n  plugins: [react()],\n})`;
    const patched = patchViteConfig(config);
    expect(patched).toContain('resolve: { tsconfigPaths: true },');
    expect(patchViteConfig(patched ?? '')).toBeUndefined();
    expect(patchViteConfig('export default {}')).toBeUndefined();
  });

  it('patches both files on disk and reports what it did', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sas-alias-'));
    writeFileSync(join(dir, 'tsconfig.app.json'), TSCONFIG);
    writeFileSync(join(dir, 'vite.config.ts'), `export default defineConfig({\n  plugins: [],\n})`);
    const result = setupAlias(dir, '@', 'src');
    expect(result).toEqual({ tsconfig: 'patched', vite: 'patched', patchedFiles: ['tsconfig.app.json', 'vite.config.ts'] });
    expect(readFileSync(join(dir, 'tsconfig.app.json'), 'utf8')).toContain('"@/*"');
    expect(setupAlias(dir, '@', 'src')).toMatchObject({ tsconfig: 'configured', vite: 'configured', patchedFiles: [] });
  });
});

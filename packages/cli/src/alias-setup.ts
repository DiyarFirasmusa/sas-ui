import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Conservative text patches for the one-time alias setup. They only insert
 * when the expected anchor exists and the thing is not already configured;
 * otherwise the caller prints instructions instead of guessing.
 */

export function patchTsconfigPaths(
  source: string,
  alias: string,
  srcDir: string,
): string | undefined {
  if (source.includes(`"${alias}/*"`)) {
    return undefined;
  }
  if (/"paths"\s*:/.test(source)) {
    return undefined;
  }
  const anchor = /"compilerOptions"\s*:\s*\{/.exec(source);
  if (!anchor) {
    return undefined;
  }
  const end = anchor.index + anchor[0].length;
  return `${source.slice(0, end)}\n    "paths": { "${alias}/*": ["./${srcDir}/*"] },${source.slice(end)}`;
}

export function patchViteConfig(source: string): string | undefined {
  if (/tsconfigPaths|alias\s*:/.test(source)) {
    return undefined;
  }
  const anchor = /defineConfig\(\s*\{/.exec(source);
  if (!anchor) {
    return undefined;
  }
  const end = anchor.index + anchor[0].length;
  return `${source.slice(0, end)}\n  resolve: { tsconfigPaths: true },${source.slice(end)}`;
}

export interface AliasSetupResult {
  tsconfig: 'patched' | 'configured' | 'manual';
  vite: 'patched' | 'configured' | 'manual' | 'absent';
  patchedFiles: string[];
}

/** Which tsconfig carries the app's compilerOptions (Vite templates split them). */
function findTsconfig(cwd: string): string | undefined {
  return ['tsconfig.app.json', 'tsconfig.json'].find((file) => {
    const path = join(cwd, file);
    return existsSync(path) && readFileSync(path, 'utf8').includes('"compilerOptions"');
  });
}

export function setupAlias(cwd: string, alias: string, srcDir: string): AliasSetupResult {
  const result: AliasSetupResult = {
    tsconfig: 'manual',
    vite: 'absent',
    patchedFiles: [],
  };

  const tsconfigName = findTsconfig(cwd);
  if (tsconfigName) {
    const path = join(cwd, tsconfigName);
    const current = readFileSync(path, 'utf8');
    if (current.includes(`"${alias}/*"`)) {
      result.tsconfig = 'configured';
    } else {
      const patched = patchTsconfigPaths(current, alias, srcDir);
      if (patched !== undefined) {
        writeFileSync(path, patched);
        result.tsconfig = 'patched';
        result.patchedFiles.push(tsconfigName);
      }
    }
  }

  const viteName = ['vite.config.ts', 'vite.config.mts', 'vite.config.js'].find((file) =>
    existsSync(join(cwd, file)),
  );
  if (viteName) {
    const path = join(cwd, viteName);
    const current = readFileSync(path, 'utf8');
    if (/tsconfigPaths|alias\s*:/.test(current)) {
      result.vite = 'configured';
    } else {
      const patched = patchViteConfig(current);
      result.vite = patched === undefined ? 'manual' : 'patched';
      if (patched !== undefined) {
        writeFileSync(path, patched);
        result.patchedFiles.push(viteName);
      }
    }
  }
  return result;
}

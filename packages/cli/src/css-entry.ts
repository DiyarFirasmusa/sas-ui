import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TAILWIND_IMPORT = /@import\s+['"]tailwindcss['"]\s*;?/;

function walk(directory: string, depth: number): string[] {
  if (depth < 0 || !existsSync(directory)) {
    return [];
  }
  return readdirSync(directory).flatMap((entry) => {
    if (entry === 'node_modules' || entry.startsWith('.')) {
      return [];
    }
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path, depth - 1) : [path];
  });
}

/** Finds the stylesheet that imports Tailwind (relative to cwd), if any. */
export function findCssEntry(cwd: string, srcDir: string): string | undefined {
  const candidates = walk(join(cwd, srcDir), 3).filter((file) => file.endsWith('.css'));
  const found = candidates.find((file) => TAILWIND_IMPORT.test(readFileSync(file, 'utf8')));
  return found ? found.slice(cwd.length + 1) : undefined;
}

/**
 * Adds `@import` lines right after the Tailwind import, once. Returns the new
 * stylesheet text, or `undefined` when everything is already imported.
 */
export function addCssImports(css: string, imports: readonly string[]): string | undefined {
  const missing = imports.filter((target) => !css.includes(target));
  if (missing.length === 0) {
    return undefined;
  }
  const lines = missing.map((target) => `@import '${target}';`).join('\n');
  const match = TAILWIND_IMPORT.exec(css);
  if (!match) {
    return `${lines}\n${css}`;
  }
  const end = match.index + match[0].length;
  return `${css.slice(0, end)}\n${lines}${css.slice(end)}`;
}

/** Relative CSS import path from one stylesheet to another file. */
export function cssImportPath(fromFile: string, toFile: string): string {
  const fromParts = fromFile.split('/').slice(0, -1);
  const toParts = toFile.split('/');
  let shared = 0;
  while (shared < fromParts.length && fromParts[shared] === toParts[shared]) {
    shared += 1;
  }
  const up = fromParts.slice(shared).map(() => '..');
  const down = toParts.slice(shared);
  const path = [...up, ...down].join('/');
  return path.startsWith('.') ? path : `./${path}`;
}

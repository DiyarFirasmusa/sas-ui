// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SRC_DIR,
  buildItems,
  importsOf,
  parseManifest,
  readManifests,
  RegistryError,
} from './build.ts';

const packageJson: {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
} = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const sourceFiles = walk(SRC_DIR).filter(
  (file) => /\.(ts|tsx)$/.test(file) && !/\.test\.(ts|tsx)$/.test(file) && !file.includes('/test/'),
);

describe('registry integrity', () => {
  const manifests = readManifests();
  const items = buildItems(manifests, packageJson);

  it('resolves every internal import to a registry item', () => {
    expect(items.length).toBeGreaterThan(0);
  });

  it('registers every source file in src/ exactly once', () => {
    const registered = new Set(manifests.flatMap((manifest) => manifest.files));
    const unregistered = sourceFiles
      .map((file) => file.slice(SRC_DIR.length + 1))
      .filter((file) => !registered.has(file));
    expect(unregistered).toEqual([]);
  });

  it('ships a test beside every ui and lib source file', () => {
    const missing = items
      .filter((item) => item.type !== 'test')
      .flatMap((item) =>
        item.files
          .filter((file) => file.role === 'source')
          .filter(
            (file) =>
              !item.files.some(
                (other) => other.path === file.path.replace(/\.(ts|tsx)$/, '.test.$1'),
              ),
          )
          .map((file) => file.path),
      );
    expect(missing).toEqual([]);
  });

  it('has no dependency cycles between items', () => {
    const graph = new Map(items.map((item) => [item.name, item.registryDependencies]));
    const visiting = new Set<string>();
    const done = new Set<string>();
    const visit = (name: string, trail: string[]) => {
      if (done.has(name)) {
        return;
      }
      expect(visiting.has(name), `cycle: ${[...trail, name].join(' → ')}`).toBe(false);
      visiting.add(name);
      for (const dependency of graph.get(name) ?? []) {
        visit(dependency, [...trail, name]);
      }
      visiting.delete(name);
      done.add(name);
    };
    for (const name of graph.keys()) {
      visit(name, []);
    }
  });

  it('rejects malformed manifests', () => {
    expect(() => parseManifest({ name: 'Bad Name' }, 'Bad Name.json')).toThrow(RegistryError);
    expect(() =>
      parseManifest(
        {
          name: 'a',
          type: 'ui',
          category: 'form',
          title: 't',
          description: 'd',
          files: [],
        },
        'a.json',
      ),
    ).toThrow(/files/);
  });

  it('reads imports from import and export-from statements', () => {
    expect(
      importsOf(`import { a } from '@/lib/utils';\nexport { b } from 'x';\nimport 'side-effect';`),
    ).toEqual(['@/lib/utils', 'x', 'side-effect']);
  });
});

/**
 * House rules, enforced on every source file so a component cannot ship a
 * direction bug or a hardcoded colour:
 * - logical properties only (RTL first-class)
 * - colours come from tokens, never hex/rgb literals in classes
 * - no `any`, no ts-ignore escape hatches
 */
describe('source rules', () => {
  const PHYSICAL =
    /(?<![\w-])(?:-?)(?:ml|mr|pl|pr|left|right)-(?:\d|\[|px|auto|full|\(|field|inline|row|panel|card|page)|(?<![\w-])(?:text-left|text-right|border-l|border-r|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br|float-left|float-right)(?![\w-])/;
  const HARD_COLOUR = /(?:bg|text|border|ring|fill|stroke|from|to|via)-\[#[0-9a-fA-F]{3,8}\]/;

  it.each(sourceFiles.map((file) => [file.slice(SRC_DIR.length + 1), file] as const))(
    '%s follows the house rules',
    (_name, file) => {
      const content = readFileSync(file, 'utf8');
      const classStrings = [...content.matchAll(/(['"`])((?:\\.|(?!\1).)*)\1/gs)].map(
        (match) => match[2] ?? '',
      );
      const physical = classStrings.filter((value) => PHYSICAL.test(value));
      expect(physical, 'use logical utilities (ps/pe/ms/me/start/end/text-start…)').toEqual([]);
      expect(HARD_COLOUR.test(content), 'use colour tokens, not hex classes').toBe(false);
      expect(
        /:\s*any\b|<any>|as any\b|@ts-ignore|@ts-expect-error/.test(content),
        'no any / ts-ignore',
      ).toBe(false);
      expect(content.split('\n').length, 'files stay under 500 lines').toBeLessThanOrEqual(500);
    },
  );
});

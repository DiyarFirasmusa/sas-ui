import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runAdd } from './commands/add.ts';
import { runDiff } from './commands/diff.ts';
import { DEFAULT_DIRECTORIES, writeConfig, type ProjectConfig } from './config.ts';
import { createLogger } from './logger.ts';
import { openRegistry } from './registry-source.ts';
import { UnknownItemError } from './resolve-items.ts';

/** A two-item fixture registry: `card` depends on `utils`. */
function fixtureRegistry(): string {
  const dir = mkdtempSync(join(tmpdir(), 'sas-reg-'));
  mkdirSync(join(dir, 'items'), { recursive: true });
  const entry = (name: string, deps: string[]) => ({
    name,
    type: 'ui',
    category: 'display',
    title: name,
    description: name,
    dependencies: {},
    devDependencies: {},
    registryDependencies: deps,
  });
  writeFileSync(
    join(dir, 'index.json'),
    JSON.stringify({
      version: '0.0.0',
      presets: [],
      items: [
        entry('utils', []),
        entry('card', ['utils']),
        { ...entry('test-utils', []), type: 'test' },
      ],
    }),
  );
  writeFileSync(
    join(dir, 'items', 'utils.json'),
    JSON.stringify({
      ...entry('utils', []),
      files: [
        {
          path: 'ui/utils.tsx',
          type: 'ui',
          role: 'source',
          content: 'export const u = 1;\n',
        },
      ],
    }),
  );
  writeFileSync(
    join(dir, 'items', 'test-utils.json'),
    JSON.stringify({
      ...entry('test-utils', []),
      type: 'test',
      files: [{ path: 'test/a11y.ts', type: 'test', role: 'source', content: 'export {};\n' }],
    }),
  );
  writeFileSync(
    join(dir, 'items', 'card.json'),
    JSON.stringify({
      ...entry('card', ['utils']),
      files: [
        {
          path: 'ui/card.tsx',
          type: 'ui',
          role: 'source',
          content: `import { u } from '@/components/ui/utils';\nexport const c = u;\n`,
        },
        {
          path: 'ui/card.test.tsx',
          type: 'ui',
          role: 'test',
          content: 'test\n',
        },
      ],
    }),
  );
  return dir;
}

function project(): { cwd: string; config: ProjectConfig } {
  const cwd = mkdtempSync(join(tmpdir(), 'sas-proj-'));
  return {
    cwd,
    config: {
      srcDir: 'src',
      alias: '@',
      directories: { ...DEFAULT_DIRECTORIES },
      css: 'src/index.css',
      preset: 'neutral',
      presets: 'single',
    },
  };
}

const silent = createLogger(() => {});

describe('add and diff', () => {
  it('copies an item with its dependencies first, without tests by default', async () => {
    const registry = fixtureRegistry();
    const { cwd, config } = project();
    const result = await runAdd(
      { cwd, logger: silent },
      { names: ['card'], install: false },
      { config, source: openRegistry({ flag: registry }) },
    );
    expect(result.written).toEqual(['src/components/ui/utils.tsx', 'src/components/ui/card.tsx']);
    expect(readFileSync(join(cwd, 'src/components/ui/card.tsx'), 'utf8')).toContain(
      '@/components/ui/utils',
    );
  });

  it('includes test files with --tests', async () => {
    const { cwd, config } = project();
    const result = await runAdd(
      { cwd, logger: silent },
      { names: ['card'], install: false, tests: true },
      { config, source: openRegistry({ flag: fixtureRegistry() }) },
    );
    expect(result.written).toContain('src/components/ui/card.test.tsx');
    expect(result.written).toContain('src/test/a11y.ts');
  });

  it('keeps a locally edited file unless --overwrite', async () => {
    const source = openRegistry({ flag: fixtureRegistry() });
    const { cwd, config } = project();
    const context = { cwd, logger: silent };
    await runAdd(context, { names: ['utils'], install: false }, { config, source });
    writeFileSync(join(cwd, 'src/components/ui/utils.tsx'), 'export const u = 2;\n');
    const kept = await runAdd(context, { names: ['utils'], install: false }, { config, source });
    expect(kept.skipped).toEqual(['src/components/ui/utils.tsx']);
    expect(readFileSync(join(cwd, 'src/components/ui/utils.tsx'), 'utf8')).toContain('= 2');
    const replaced = await runAdd(
      context,
      { names: ['utils'], install: false, overwrite: true },
      { config, source },
    );
    expect(replaced.overwritten).toEqual(['src/components/ui/utils.tsx']);
  });

  it('dry-run writes nothing', async () => {
    const { cwd, config } = project();
    const result = await runAdd(
      { cwd, logger: silent },
      { names: ['utils'], install: false, dryRun: true },
      { config, source: openRegistry({ flag: fixtureRegistry() }) },
    );
    expect(result.written).toHaveLength(1);
    expect(() => readFileSync(join(cwd, 'src/components/ui/utils.tsx'))).toThrow();
  });

  it('rejects unknown names before writing anything', async () => {
    const { cwd, config } = project();
    await expect(
      runAdd(
        { cwd, logger: silent },
        { names: ['nope'], install: false },
        { config, source: openRegistry({ flag: fixtureRegistry() }) },
      ),
    ).rejects.toBeInstanceOf(UnknownItemError);
  });

  it('diff reports unchanged, modified and missing files', async () => {
    const registry = fixtureRegistry();
    const { cwd, config } = project();
    const withRegistry = { ...config, registry };
    writeConfig(cwd, withRegistry);
    const context = { cwd, logger: silent };
    await runAdd(
      context,
      { names: ['card'], install: false },
      { config: withRegistry, source: openRegistry({ flag: registry }) },
    );

    const clean = await runDiff(context, { names: [] });
    expect(clean.every((entry) => entry.status === 'unchanged')).toBe(true);

    writeFileSync(join(cwd, 'src/components/ui/card.tsx'), 'export const c = 0;\n');
    const modified = await runDiff(context, { names: ['card'] });
    expect(modified.find((entry) => entry.path.endsWith('card.tsx'))).toMatchObject({
      status: 'modified',
    });

    const missing = await runDiff({ cwd: project().cwd, logger: silent }, { names: [] }).catch(
      (error: unknown) => error,
    );
    expect(missing).toBeInstanceOf(Error);
  });
});

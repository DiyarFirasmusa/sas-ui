import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runUpstream } from './commands/upstream.ts';
import { DEFAULT_DIRECTORIES, writeConfig } from './config.ts';
import { createLogger } from './logger.ts';

function fixture() {
  const registry = mkdtempSync(join(tmpdir(), 'sas-up-reg-'));
  mkdirSync(join(registry, 'items'), { recursive: true });
  const entry = {
    name: 'card',
    type: 'ui',
    category: 'display',
    title: 'card',
    description: 'card',
    dependencies: {},
    devDependencies: {},
    registryDependencies: [],
  };
  writeFileSync(
    join(registry, 'index.json'),
    JSON.stringify({ version: '0.0.0', presets: [], items: [entry] }),
  );
  writeFileSync(
    join(registry, 'items', 'card.json'),
    JSON.stringify({
      ...entry,
      files: [
        {
          path: 'ui/card.tsx',
          type: 'ui',
          role: 'source',
          content: "import { cn } from '@/lib/utils';\n",
        },
      ],
    }),
  );
  const project = mkdtempSync(join(tmpdir(), 'sas-up-proj-'));
  writeConfig(project, {
    srcDir: 'src',
    alias: '~',
    directories: { ...DEFAULT_DIRECTORIES, lib: 'utils' },
    css: 'src/i.css',
    preset: 'neutral',
    presets: 'single',
    registry,
  });
  mkdirSync(join(project, 'src/components/ui'), { recursive: true });
  const library = mkdtempSync(join(tmpdir(), 'sas-up-lib-'));
  return { project, library };
}

const silent = createLogger(() => {});

describe('upstream', () => {
  it('writes an improved file into the library with registry aliases', async () => {
    const { project, library } = fixture();
    writeFileSync(
      join(project, 'src/components/ui/card.tsx'),
      "import { cn } from '~/utils/utils';\n// improved\n",
    );
    const result = await runUpstream(
      { cwd: project, logger: silent },
      { names: ['card'], to: library },
    );
    expect(result.updated).toEqual(['ui/card.tsx']);
    expect(readFileSync(join(library, 'ui/card.tsx'), 'utf8')).toBe(
      "import { cn } from '@/lib/utils';\n// improved\n",
    );
    const again = await runUpstream(
      { cwd: project, logger: silent },
      { names: ['card'], to: library },
    );
    expect(again.unchanged).toEqual(['ui/card.tsx']);
  });

  it('dry-run writes nothing and a missing file is reported', async () => {
    const { project, library } = fixture();
    const missing = await runUpstream(
      { cwd: project, logger: silent },
      { names: ['card'], to: library },
    );
    expect(missing.missing).toEqual(['ui/card.tsx']);
    writeFileSync(join(project, 'src/components/ui/card.tsx'), 'x');
    await runUpstream(
      { cwd: project, logger: silent },
      { names: ['card'], to: library, dryRun: true },
    );
    expect(() => readFileSync(join(library, 'ui/card.tsx'))).toThrow();
  });

  it('asks where the library is', async () => {
    const { project } = fixture();
    await expect(
      runUpstream({ cwd: project, logger: silent }, { names: ['card'] }),
    ).rejects.toThrow(/--to/);
  });
});

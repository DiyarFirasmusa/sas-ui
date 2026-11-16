#!/usr/bin/env node
/**
 * End-to-end check of the CLI against a real scratch Vite + React + Tailwind v4
 * project: init → add → diff → theme set → typecheck → production build.
 * Needs network (npm install). Usage: pnpm e2e:cli [--keep]
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(root, 'packages', 'cli', 'dist', 'bin.js');
const keep = process.argv.includes('--keep');
const workdir = mkdtempSync(join(tmpdir(), 'sas-ui-e2e-'));
const app = join(workdir, 'app');

function run(command, args, cwd = app) {
  console.log(`$ ${command} ${args.join(' ')}`);
  return execFileSync(command, args, {
    cwd,
    stdio: ['ignore', 'pipe', 'inherit'],
    encoding: 'utf8',
  });
}
function check(condition, message) {
  if (!condition) {
    throw new Error(`E2E FAILED: ${message}`);
  }
  console.log(`  ok  ${message}`);
}

try {
  if (!existsSync(cli)) {
    throw new Error('Build first: pnpm build');
  }
  run(
    'npm',
    ['create', 'vite@latest', 'app', '--', '--template', 'react-ts', '--no-interactive'],
    workdir,
  );
  run('npm', ['install', '--no-audit', '--no-fund']);
  run('npm', ['install', 'tailwindcss', '@tailwindcss/vite', '--no-audit', '--no-fund']);

  writeFileSync(
    join(app, 'vite.config.ts'),
    `import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
`,
  );
  writeFileSync(join(app, 'src', 'index.css'), `@import 'tailwindcss';\n`);

  console.log(run('node', [cli, 'init', '--preset', 'wine-lapis', '--all-presets']));
  for (const file of [
    'sas-ui.json',
    'src/styles/sas-ui/theme.css',
    'src/styles/sas-ui/preset.css',
    'src/lib/utils.ts',
    'src/lib/variants.ts',
  ]) {
    check(existsSync(join(app, file)), `${file} created`);
  }
  check(
    readFileSync(join(app, 'src/index.css'), 'utf8').includes('styles/sas-ui/theme.css'),
    'index.css imports the theme',
  );
  check(
    readFileSync(join(app, 'tsconfig.app.json'), 'utf8').includes('"@/*"'),
    'tsconfig alias configured',
  );

  console.log(run('node', [cli, 'add', 'button', 'dialog', 'field', 'select', 'spinner']));
  for (const file of ['button', 'spinner', 'icons', 'dialog', 'field', 'select', 'input']) {
    check(
      existsSync(join(app, `src/components/ui/${file}.tsx`)),
      `components/ui/${file}.tsx copied (with dependencies)`,
    );
  }
  check(existsSync(join(app, 'node_modules/@base-ui/react')), '@base-ui/react installed');

  // A heavier slice: data table, filters, pickers, bound form fields, shell, command palette.
  console.log(
    run('node', [
      cli,
      'add',
      'data-table',
      'filter-bar',
      'date-range-picker',
      'time-picker',
      'form-fields',
      'app-shell',
      'command',
      'tree-picker',
      'file-upload',
      'toast',
      'confirm-dialog',
      '--tests',
    ]),
  );
  for (const file of [
    'data-table',
    'filter-bar',
    'date-picker',
    'calendar',
    'form',
    'sidebar',
    'sheet',
    'command-input',
    'tree',
    'toast',
  ]) {
    check(
      existsSync(join(app, `src/components/ui/${file}.tsx`)),
      `components/ui/${file}.tsx copied`,
    );
  }
  check(
    existsSync(join(app, 'src/components/ui/data-table.test.tsx')),
    '--tests copies test files',
  );
  check(existsSync(join(app, 'src/test/a11y.ts')), 'test utilities copied for the tests');
  check(
    existsSync(join(app, 'node_modules/@tanstack/react-table')) &&
      existsSync(join(app, 'node_modules/react-hook-form')),
    'extra dependencies installed',
  );

  // Blocks: whole pages that pull in dozens of components, charts and forms.
  console.log(
    run('node', [
      cli,
      'add',
      'dashboard-01',
      'list-page-01',
      'detail-page-01',
      'shell-01',
      'wizard-01',
      'login-02',
      'error-page-01',
    ]),
  );
  for (const file of [
    'dashboard-01',
    'list-page-01',
    'detail-page-01',
    'shell-01',
    'wizard-01',
    'login-02',
    'error-page-01',
    'chart-area-01',
  ]) {
    check(
      existsSync(join(app, `src/components/blocks/${file}.tsx`)),
      `components/blocks/${file}.tsx copied`,
    );
  }

  const diffClean = run('node', [cli, 'diff']);
  check(diffClean.includes('matches the registry'), 'diff is clean right after add');
  writeFileSync(
    join(app, 'src/components/ui/spinner.tsx'),
    readFileSync(join(app, 'src/components/ui/spinner.tsx'), 'utf8') + '\n// local edit\n',
  );
  let diffExit = 0;
  try {
    run('node', [cli, 'diff', 'spinner']);
  } catch (error) {
    diffExit = error.status ?? 1;
  }
  check(diffExit === 1, 'diff exits 1 and reports a locally edited file');

  console.log(run('node', [cli, 'theme', 'set', 'hr']));
  check(
    readFileSync(join(app, 'src/styles/sas-ui/preset.css'), 'utf8').includes('data-preset="hr"'),
    'theme set rewrote the preset CSS',
  );

  writeFileSync(
    join(app, 'src', 'App.tsx'),
    `import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Dashboard01 } from '@/components/blocks/dashboard-01';

export default function App() {
  return (
    <main className="bg-background text-foreground min-h-screen p-card">
      <h1 className="text-h1">SAS UI scratch app</h1>
      <div className="mt-row flex gap-field">
        <Button>Save</Button>
        <Button variant="outline">Cancel</Button>
        <Select aria-label="Status" placeholder="Status" options={[{ value: 'a', label: 'A' }]} />
      </div>
      <Dashboard01 />
    </main>
  );
}
`,
  );
  run('npx', ['tsc', '-b']);
  check(true, 'scratch app typechecks with the copied components');
  run('npx', ['vite', 'build']);
  const css = readFileSync(join(app, 'dist', 'assets', readdirAssets(app)), 'utf8');
  check(css.includes('--primary'), 'built CSS contains the preset variables');
  check(
    /\.bg-primary\b/.test(css) && /\.text-h1\b/.test(css),
    'built CSS contains the token utilities used by the components',
  );
  console.log('\nE2E PASSED');
} finally {
  if (keep) {
    console.log(`kept ${workdir}`);
  } else {
    rmSync(workdir, { recursive: true, force: true });
  }
}

function readdirAssets(appDir) {
  const names = execFileSync('ls', [join(appDir, 'dist', 'assets')], {
    encoding: 'utf8',
  }).split('\n');
  const file = names.find((name) => name.endsWith('.css'));
  if (!file) {
    throw new Error('no built css');
  }
  return file;
}

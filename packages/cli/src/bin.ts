#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { runAdd } from './commands/add.ts';
import { runDiff } from './commands/diff.ts';
import { runInit } from './commands/init.ts';
import { runList } from './commands/list.ts';
import { runTheme } from './commands/theme.ts';
import { runUpstream } from './commands/upstream.ts';
import { ConfigError } from './config.ts';
import { color, createLogger } from './logger.ts';

const HELP = `${color.bold('sas-ui')} — own-the-code React components with RTL-first theming

Usage
  sas-ui init   [--preset <name>] [--all-presets] [--css <file>] [--src-dir src] [--alias @] [--force] [--no-install] [--no-alias-setup]
  sas-ui add    <component...> [--all] [--overwrite] [--tests] [--dry-run] [--no-install]
  sas-ui diff   [component...] [--verbose]
  sas-ui upstream <item...> --to <library>/packages/registry/src [--dry-run]
  sas-ui list   [--category <name>] [--installed] [--json]
  sas-ui theme  list | set <preset> [--all-presets]

Global options
  --cwd <dir>        project directory (default: current)
  --registry <dir|url>  use another registry (also SAS_UI_REGISTRY)
  -h, --help         show this help
  -v, --version      show the version
`;

function version(): string {
  const root = dirname(fileURLToPath(import.meta.url));
  for (const candidate of [
    join(root, '..', 'package.json'),
    join(root, '..', '..', 'package.json'),
  ]) {
    try {
      const parsed: unknown = JSON.parse(readFileSync(candidate, 'utf8'));
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'version' in parsed &&
        typeof parsed.version === 'string'
      ) {
        return parsed.version;
      }
    } catch {
      // try the next candidate
    }
  }
  return '0.0.0';
}

export async function main(argv: string[]): Promise<number> {
  const logger = createLogger();
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
      cwd: { type: 'string' },
      registry: { type: 'string' },
      preset: { type: 'string' },
      'all-presets': { type: 'boolean' },
      css: { type: 'string' },
      'src-dir': { type: 'string' },
      alias: { type: 'string' },
      force: { type: 'boolean' },
      'no-install': { type: 'boolean' },
      'no-alias-setup': { type: 'boolean' },
      all: { type: 'boolean' },
      overwrite: { type: 'boolean' },
      tests: { type: 'boolean' },
      'dry-run': { type: 'boolean' },
      verbose: { type: 'boolean' },
      category: { type: 'string' },
      installed: { type: 'boolean' },
      json: { type: 'boolean' },
      to: { type: 'string' },
    },
  });
  if (values.version === true) {
    logger.line(version());
    return 0;
  }
  const [command, ...rest] = positionals;
  if (values.help === true || command === undefined) {
    logger.line(HELP);
    return command === undefined && values.help !== true ? 1 : 0;
  }

  const context = {
    cwd: values.cwd ?? process.cwd(),
    logger,
    ...(values.registry ? { registry: values.registry } : {}),
  };
  try {
    switch (command) {
      case 'init':
        await runInit(context, {
          preset: values.preset,
          allPresets: values['all-presets'],
          css: values.css,
          srcDir: values['src-dir'],
          alias: values.alias,
          force: values.force,
          install: values['no-install'] !== true,
          skipAliasSetup: values['no-alias-setup'],
        });
        return 0;
      case 'add':
        await runAdd(context, {
          names: rest,
          all: values.all,
          overwrite: values.overwrite,
          tests: values.tests,
          dryRun: values['dry-run'],
          install: values['no-install'] !== true,
        });
        return 0;
      case 'diff': {
        const results = await runDiff(context, {
          names: rest,
          verbose: values.verbose,
        });
        return results.some((result) => result.status === 'modified') ? 1 : 0;
      }
      case 'upstream':
        await runUpstream(context, { names: rest, to: values.to, dryRun: values['dry-run'] });
        return 0;
      case 'list':
        await runList(context, {
          category: values.category,
          installed: values.installed,
          json: values.json,
        });
        return 0;
      case 'theme': {
        const [action, preset] = rest;
        if (action !== 'list' && action !== 'set') {
          logger.error('Usage: sas-ui theme list | sas-ui theme set <preset>');
          return 1;
        }
        await runTheme(context, { action, preset, all: values['all-presets'] });
        return 0;
      }
      default:
        logger.error(`Unknown command "${command}".`);
        logger.line(HELP);
        return 1;
    }
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    return error instanceof ConfigError ? 2 : 1;
  }
}

process.exitCode = await main(process.argv.slice(2));

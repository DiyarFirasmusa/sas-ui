import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { setupAlias } from '../alias-setup.ts';
import { CONFIG_FILE, DEFAULT_DIRECTORIES, writeConfig, type ProjectConfig } from '../config.ts';
import { addCssImports, cssImportPath, findCssEntry } from '../css-entry.ts';
import { color } from '../logger.ts';
import {
  readProjectFile,
  writeProjectFile,
  writeTokenCss,
  type CommandContext,
} from '../project.ts';
import { openRegistry } from '../registry-source.ts';
import { runAdd } from './add.ts';

export interface InitOptions {
  preset?: string;
  allPresets?: boolean;
  css?: string;
  srcDir?: string;
  alias?: string;
  force?: boolean;
  install?: boolean;
  /** Leave tsconfig/vite config alone and only print what to add. */
  skipAliasSetup?: boolean;
}

export const DEFAULT_PRESET = 'neutral';
/** Foundation items every project needs: they hold cn() and the variants helper. */
const FOUNDATION_ITEMS = ['utils', 'variants'];

function hasAliasInTsconfig(cwd: string, alias: string): boolean {
  return ['tsconfig.json', 'tsconfig.app.json'].some((file) => {
    const path = join(cwd, file);
    return existsSync(path) && readFileSync(path, 'utf8').includes(`"${alias}/*"`);
  });
}

export async function runInit(
  context: CommandContext,
  options: InitOptions,
): Promise<ProjectConfig> {
  const { cwd, logger } = context;
  if (!existsSync(join(cwd, 'package.json'))) {
    throw new Error(`No package.json in ${cwd}. Run "sas-ui init" inside your Vite/React project.`);
  }
  if (existsSync(join(cwd, CONFIG_FILE)) && options.force !== true) {
    throw new Error(
      `${CONFIG_FILE} already exists. Use --force to re-initialise, or "sas-ui theme set <preset>" to change the theme.`,
    );
  }

  const srcDir = options.srcDir ?? 'src';
  const css = options.css ?? findCssEntry(cwd, srcDir);
  if (!css) {
    throw new Error(
      'Could not find a stylesheet that imports Tailwind (@import "tailwindcss"). Pass it with --css <file>.',
    );
  }
  const source = openRegistry({ flag: context.registry });
  const index = await source.getIndex();
  const preset = options.preset ?? DEFAULT_PRESET;
  if (!index.presets.some((entry) => entry.name === preset)) {
    throw new Error(
      `Unknown preset "${preset}". Available: ${index.presets.map((entry) => entry.name).join(', ')}`,
    );
  }

  const config: ProjectConfig = {
    srcDir,
    alias: options.alias ?? '@',
    directories: { ...DEFAULT_DIRECTORIES },
    css,
    preset,
    presets: options.allPresets === true ? 'all' : 'single',
    ...(context.registry ? { registry: context.registry } : {}),
  };

  const cssFiles = await writeTokenCss(cwd, config, source);
  for (const file of cssFiles) {
    logger.success(`Wrote ${file}`);
  }
  const entry = readProjectFile(cwd, css);
  if (entry === undefined) {
    writeProjectFile(cwd, css, `@import 'tailwindcss';\n`);
  }
  const updated = addCssImports(
    readProjectFile(cwd, css) ?? '',
    cssFiles.map((file) => cssImportPath(css, file)),
  );
  if (updated !== undefined) {
    writeProjectFile(cwd, css, updated);
    logger.success(`Added the token imports to ${css}`);
  }

  writeConfig(cwd, config);
  logger.success(`Wrote ${CONFIG_FILE}`);
  await runAdd(context, { names: FOUNDATION_ITEMS, install: options.install }, { config, source });

  if (options.skipAliasSetup !== true) {
    const alias = setupAlias(cwd, config.alias, srcDir);
    for (const file of alias.patchedFiles) {
      logger.success(`Configured the "${config.alias}/*" alias in ${file}`);
    }
    if (alias.vite === 'manual') {
      logger.warn(
        'Add  resolve: { tsconfigPaths: true }  (Vite 8) or a resolve.alias to your Vite config.',
      );
    }
  }
  if (!hasAliasInTsconfig(cwd, config.alias)) {
    logger.warn(
      `No "${config.alias}/*" path found in tsconfig. Add  "paths": { "${config.alias}/*": ["./${srcDir}/*"] }  to your tsconfig (and a matching alias in vite.config).`,
    );
  }
  logger.line();
  logger.line(color.bold('Next steps'));
  logger.line(
    `  1. Set the language on <html>:  <html lang="ar" dir="rtl" data-preset="${preset}">`,
  );
  logger.line('  2. Add components:              sas-ui add button input dialog');
  logger.line('  3. Switch the palette later:    sas-ui theme set <preset>');
  return config;
}

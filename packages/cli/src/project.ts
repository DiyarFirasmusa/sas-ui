import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { ProjectConfig } from './config.ts';
import type { Logger } from './logger.ts';
import type { RegistrySource } from './registry-source.ts';
import type { ItemType, RegistryFile } from './registry-types.ts';
import { rewriteImports } from './rewrite-imports.ts';

export interface CommandContext {
  cwd: string;
  logger: Logger;
  /** Value of --registry, if given. */
  registry?: string;
}

const DIRECTORY_KEY: Record<ItemType, keyof ProjectConfig['directories']> = {
  ui: 'ui',
  lib: 'lib',
  hook: 'hooks',
  test: 'test',
};

/** Project-relative destination of a registry file. */
export function targetPath(config: ProjectConfig, file: RegistryFile): string {
  const name = file.path.split('/').pop() ?? file.path;
  return join(config.srcDir, config.directories[DIRECTORY_KEY[file.type]], name);
}

export function renderedContent(config: ProjectConfig, file: RegistryFile): string {
  return rewriteImports(file.content, config);
}

export function writeProjectFile(cwd: string, relativePath: string, content: string): void {
  const absolute = join(cwd, relativePath);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
}

export function readProjectFile(cwd: string, relativePath: string): string | undefined {
  const absolute = join(cwd, relativePath);
  return existsSync(absolute) ? readFileSync(absolute, 'utf8') : undefined;
}

export function stylesDirectory(config: ProjectConfig): string {
  return join(config.srcDir, 'styles', 'sas-ui');
}

export const THEME_FILE = 'theme.css';
export const PRESET_FILE = 'preset.css';

/**
 * Writes the token CSS for the chosen preset mode and returns the files
 * (relative to the project) the entry stylesheet must import.
 */
export async function writeTokenCss(
  cwd: string,
  config: ProjectConfig,
  source: RegistrySource,
): Promise<string[]> {
  const directory = stylesDirectory(config);
  writeProjectFile(cwd, join(directory, THEME_FILE), await source.getCss(THEME_FILE));
  const preset = await source.getCss(`preset-${config.preset}.css`);
  const content =
    config.presets === 'all' ? `${preset}\n${await source.getCss('presets.css')}` : preset;
  writeProjectFile(cwd, join(directory, PRESET_FILE), content);
  return [join(directory, THEME_FILE), join(directory, PRESET_FILE)];
}

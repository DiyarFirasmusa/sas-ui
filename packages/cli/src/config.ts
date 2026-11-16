import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const CONFIG_FILE = 'sas-ui.json';

export interface ProjectConfig {
  /** Folder (relative to the project) the alias points at. */
  srcDir: string;
  /** Import alias for srcDir, e.g. "@". */
  alias: string;
  /** Where each registry item type is copied, relative to srcDir. */
  directories: { ui: string; lib: string; hooks: string; test: string; blocks: string };
  /** CSS entry file that imports Tailwind (relative to the project). */
  css: string;
  /** Active preset; with `presets: "all"` it is the default one. */
  preset: string;
  /** `single` writes one preset as :root/.dark; `all` ships every preset switchable at runtime. */
  presets: 'single' | 'all';
  /** Registry location: a directory or an http(s) URL. Omit to use the one bundled with the CLI. */
  registry?: string;
}

export class ConfigError extends Error {}

export const DEFAULT_DIRECTORIES: ProjectConfig['directories'] = {
  ui: 'components/ui',
  lib: 'lib',
  hooks: 'hooks',
  test: 'test',
  blocks: 'components/blocks',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  if (typeof value !== 'string' || value === '') {
    throw new ConfigError(`${CONFIG_FILE}: "${key}" must be a non-empty string`);
  }
  return value;
}

export function parseConfig(raw: unknown): ProjectConfig {
  if (!isRecord(raw)) {
    throw new ConfigError(`${CONFIG_FILE} must contain a JSON object`);
  }
  const directoriesRaw = raw.directories;
  const directories = { ...DEFAULT_DIRECTORIES };
  if (isRecord(directoriesRaw)) {
    for (const key of Object.keys(directories) as (keyof typeof directories)[]) {
      const value = directoriesRaw[key];
      if (typeof value === 'string' && value !== '') {
        directories[key] = value;
      }
    }
  }
  const presets = raw.presets === 'all' ? 'all' : 'single';
  const registry = typeof raw.registry === 'string' ? raw.registry : undefined;
  return {
    srcDir: text(raw, 'srcDir'),
    alias: text(raw, 'alias'),
    directories,
    css: text(raw, 'css'),
    preset: text(raw, 'preset'),
    presets,
    ...(registry ? { registry } : {}),
  };
}

export function readConfig(cwd: string): ProjectConfig {
  const path = join(cwd, CONFIG_FILE);
  if (!existsSync(path)) {
    throw new ConfigError(`No ${CONFIG_FILE} found in ${cwd}. Run "sas-ui init" first.`);
  }
  try {
    return parseConfig(JSON.parse(readFileSync(path, 'utf8')));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ConfigError(`${CONFIG_FILE} is not valid JSON: ${error.message}`);
    }
    throw error;
  }
}

export function writeConfig(cwd: string, config: ProjectConfig): void {
  const document = { $schema: 'https://sas-ui.dev/schema.json', ...config };
  writeFileSync(join(cwd, CONFIG_FILE), `${JSON.stringify(document, null, 2)}\n`);
}

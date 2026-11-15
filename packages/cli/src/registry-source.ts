import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RegistryReadError,
  parseIndex,
  parseItem,
  type RegistryIndex,
  type RegistryItem,
} from './registry-types.ts';

/** Where the registry's JSON and CSS come from: a folder or a URL. */
export interface RegistrySource {
  readonly location: string;
  getIndex(): Promise<RegistryIndex>;
  getItem(name: string): Promise<RegistryItem>;
  getCss(file: string): Promise<string>;
}

function isUrl(location: string): boolean {
  return /^https?:\/\//.test(location);
}

function directorySource(directory: string): RegistrySource {
  const read = (relative: string): string => {
    const path = join(directory, relative);
    if (!existsSync(path)) {
      throw new RegistryReadError(`Registry file not found: ${path}`);
    }
    return readFileSync(path, 'utf8');
  };
  return {
    location: directory,
    getIndex: async () => parseIndex(JSON.parse(read('index.json'))),
    getItem: async (name) => parseItem(JSON.parse(read(`items/${name}.json`))),
    getCss: async (file) => read(`css/${file}`),
  };
}

function urlSource(base: string): RegistrySource {
  const root = base.replace(/\/$/, '');
  const fetchText = async (relative: string): Promise<string> => {
    const response = await fetch(`${root}/${relative}`);
    if (!response.ok) {
      throw new RegistryReadError(`${root}/${relative} → HTTP ${response.status}`);
    }
    return response.text();
  };
  return {
    location: root,
    getIndex: async () => parseIndex(JSON.parse(await fetchText('index.json'))),
    getItem: async (name) => parseItem(JSON.parse(await fetchText(`items/${name}.json`))),
    getCss: (file) => fetchText(`css/${file}`),
  };
}

/** The registry copy shipped inside the CLI package (dist/ → ../registry). */
export function bundledRegistryPath(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', 'registry');
}

/**
 * Picks the registry: explicit flag, then SAS_UI_REGISTRY, then the project
 * config, then the copy bundled with this CLI version (offline, reproducible).
 */
export function openRegistry(options: { flag?: string; configured?: string }): RegistrySource {
  const location =
    options.flag ?? process.env.SAS_UI_REGISTRY ?? options.configured ?? bundledRegistryPath();
  return isUrl(location) ? urlSource(location) : directorySource(resolve(location));
}

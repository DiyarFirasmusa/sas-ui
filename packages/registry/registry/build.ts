import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CATEGORIES,
  ITEM_TYPES,
  type ItemFile,
  type ItemManifest,
  type ItemType,
  type RegistryIndex,
  type RegistryItem,
} from './schema.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SRC_DIR = join(ROOT, 'src');
const ITEMS_DIR = join(ROOT, 'registry', 'items');

const ALIAS_PREFIXES: Record<string, ItemType> = {
  '@/components/ui/': 'ui',
  '@/lib/': 'lib',
  '@/hooks/': 'hook',
  '@/test/': 'test',
  '@/components/blocks/': 'block',
};

/** The directory (under src/) each item type lives in. */
export const TYPE_DIRECTORY: Record<ItemType, string> = {
  ui: 'ui',
  lib: 'lib',
  hook: 'hooks',
  test: 'test',
  block: 'blocks',
};

const KEBAB_FILE = /^[a-z0-9]+(-[a-z0-9]+)*\.(ts|tsx)$/;
const IMPORT_PATTERN =
  /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g;

export class RegistryError extends Error {}

export function readManifests(itemsDir = ITEMS_DIR): ItemManifest[] {
  return readdirSync(itemsDir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => {
      const raw: unknown = JSON.parse(readFileSync(join(itemsDir, file), 'utf8'));
      return parseManifest(raw, file);
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseManifest(raw: unknown, source: string): ItemManifest {
  if (!isRecord(raw)) {
    throw new RegistryError(`${source}: manifest must be an object`);
  }
  const { name, type, category, title, description, files, tier, extraDevDependencies } = raw;
  if (typeof name !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    throw new RegistryError(`${source}: "name" must be kebab-case`);
  }
  if (source.replace(/\.json$/, '') !== name) {
    throw new RegistryError(`${source}: file name must match name "${name}"`);
  }
  const itemType = ITEM_TYPES.find((candidate) => candidate === type);
  if (!itemType) {
    throw new RegistryError(`${source}: "type" must be one of ${ITEM_TYPES.join(', ')}`);
  }
  const itemCategory = CATEGORIES.find((candidate) => candidate === category);
  if (!itemCategory) {
    throw new RegistryError(`${source}: "category" must be one of ${CATEGORIES.join(', ')}`);
  }
  if (typeof title !== 'string' || typeof description !== 'string') {
    throw new RegistryError(`${source}: "title" and "description" are required`);
  }
  if (
    !Array.isArray(files) ||
    files.length === 0 ||
    !files.every((file) => typeof file === 'string')
  ) {
    throw new RegistryError(`${source}: "files" must be a non-empty string array`);
  }
  return {
    name,
    type: itemType,
    category: itemCategory,
    title,
    description,
    files: files.filter((file): file is string => typeof file === 'string'),
    tier: tier === 'extra' ? 'extra' : 'core',
    extraDevDependencies: Array.isArray(extraDevDependencies)
      ? extraDevDependencies.filter((entry): entry is string => typeof entry === 'string')
      : [],
  };
}

function typeOfPath(path: string): ItemType {
  const directory = path.split('/')[0];
  const found = ITEM_TYPES.find((type) => TYPE_DIRECTORY[type] === directory);
  if (!found) {
    throw new RegistryError(`${path}: must live under ui/, blocks/, lib/, hooks/ or test/`);
  }
  return found;
}

function testPathFor(path: string): string {
  return path.replace(/\.(ts|tsx)$/, '.test.$1');
}

export function collectFiles(manifest: ItemManifest, srcDir = SRC_DIR): ItemFile[] {
  const files: ItemFile[] = [];
  for (const path of manifest.files) {
    const base = path.split('/').pop() ?? path;
    if (!KEBAB_FILE.test(base)) {
      throw new RegistryError(`${manifest.name}: ${path} is not a kebab-case .ts/.tsx file`);
    }
    const absolute = join(srcDir, path);
    if (!existsSync(absolute)) {
      throw new RegistryError(`${manifest.name}: ${path} does not exist`);
    }
    const type = typeOfPath(path);
    files.push({
      path,
      type,
      role: 'source',
      content: readFileSync(absolute, 'utf8'),
    });
    const testPath = testPathFor(path);
    if (existsSync(join(srcDir, testPath))) {
      files.push({
        path: testPath,
        type,
        role: 'test',
        content: readFileSync(join(srcDir, testPath), 'utf8'),
      });
    }
  }
  return files;
}

export function importsOf(content: string): string[] {
  return [...content.matchAll(IMPORT_PATTERN)]
    .map((match) => match[1] ?? match[2])
    .filter((specifier): specifier is string => specifier !== undefined);
}

function packageName(specifier: string): string {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : (parts[0] ?? specifier);
}

/** Aliased import → the src/ path it points at (without extension). */
export function aliasTarget(specifier: string): string | undefined {
  for (const [prefix, type] of Object.entries(ALIAS_PREFIXES)) {
    if (specifier.startsWith(prefix)) {
      return `${TYPE_DIRECTORY[type]}/${specifier.slice(prefix.length)}`;
    }
  }
  return undefined;
}

const PEER_PACKAGES = new Set(['react', 'react-dom']);

export function buildItems(
  manifests: ItemManifest[],
  packageJson: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  },
  srcDir = SRC_DIR,
): RegistryItem[] {
  const owners = new Map<string, string>();
  const collected = manifests.map((manifest) => ({
    manifest,
    files: collectFiles(manifest, srcDir),
  }));
  for (const { manifest, files } of collected) {
    for (const file of files.filter((entry) => entry.role === 'source')) {
      const key = file.path.replace(/\.(ts|tsx)$/, '');
      if (owners.has(key)) {
        throw new RegistryError(
          `${file.path} is claimed by both "${owners.get(key)}" and "${manifest.name}"`,
        );
      }
      owners.set(key, manifest.name);
    }
  }

  const names = new Set<string>();
  return collected.map(({ manifest, files }) => {
    if (names.has(manifest.name)) {
      throw new RegistryError(`duplicate item "${manifest.name}"`);
    }
    names.add(manifest.name);
    const dependencies: Record<string, string> = {};
    const devDependencies: Record<string, string> = {};
    const registryDependencies = new Set<string>();
    const testRegistryDependencies = new Set<string>();
    for (const file of files) {
      const isTest = file.role === 'test';
      for (const specifier of importsOf(file.content)) {
        if (specifier.startsWith('.')) {
          throw new RegistryError(
            `${file.path}: use the @/ aliases, not relative import "${specifier}"`,
          );
        }
        const target = aliasTarget(specifier);
        if (target !== undefined) {
          const owner = owners.get(target);
          if (!owner) {
            throw new RegistryError(
              `${file.path}: imports "${specifier}" which no registry item provides`,
            );
          }
          if (owner !== manifest.name) {
            (isTest ? testRegistryDependencies : registryDependencies).add(owner);
          }
        } else if (!specifier.startsWith('@/') && !specifier.startsWith('node:')) {
          const name = packageName(specifier);
          if (PEER_PACKAGES.has(name)) {
            continue;
          }
          const isDevOnly = manifest.type === 'test' || isTest;
          const version = isDevOnly
            ? (packageJson.devDependencies?.[name] ?? packageJson.dependencies?.[name])
            : packageJson.dependencies?.[name];
          if (!version) {
            throw new RegistryError(
              `${file.path}: imports "${name}" which is not in @sas-ui/registry dependencies`,
            );
          }
          (isDevOnly ? devDependencies : dependencies)[name] = version;
        }
      }
    }
    for (const owner of registryDependencies) {
      testRegistryDependencies.delete(owner);
    }
    testRegistryDependencies.delete('test-utils');
    for (const extra of manifest.extraDevDependencies ?? []) {
      const version = packageJson.devDependencies?.[extra] ?? packageJson.dependencies?.[extra];
      if (!version) {
        throw new RegistryError(
          `${manifest.name}: extraDevDependencies "${extra}" is not in @sas-ui/registry package.json`,
        );
      }
      devDependencies[extra] = version;
    }
    return {
      name: manifest.name,
      type: manifest.type,
      category: manifest.category,
      title: manifest.title,
      description: manifest.description,
      tier: manifest.tier,
      dependencies,
      devDependencies,
      registryDependencies: [...registryDependencies].sort(),
      testRegistryDependencies: [...testRegistryDependencies].sort(),
      files,
    };
  });
}

export function buildIndex(
  items: RegistryItem[],
  version: string,
  presets: RegistryIndex['presets'],
): RegistryIndex {
  return {
    version,
    presets,
    items: items.map(({ files, ...entry }) => ({
      ...entry,
      fileCount: files.length,
    })),
  };
}

export function relativeToRoot(path: string): string {
  return relative(ROOT, path);
}

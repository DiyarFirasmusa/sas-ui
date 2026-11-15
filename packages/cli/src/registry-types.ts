export type ItemType = 'ui' | 'lib' | 'hook' | 'test';

export interface RegistryFile {
  /** Path relative to the registry's src/, e.g. "ui/button.tsx". */
  path: string;
  type: ItemType;
  role: 'source' | 'test';
  content: string;
}

export interface RegistryItem {
  name: string;
  type: ItemType;
  category: string;
  title: string;
  description: string;
  tier?: 'core' | 'extra';
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  registryDependencies: string[];
  testRegistryDependencies: string[];
  files: RegistryFile[];
}

export interface RegistryIndexEntry extends Omit<RegistryItem, 'files'> {
  fileCount: number;
}

export interface RegistryIndex {
  version: string;
  items: RegistryIndexEntry[];
  presets: {
    name: string;
    label: { en: string; ar: string };
    description: string;
  }[];
}

export class RegistryReadError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') {
      result[key] = entry;
    }
  }
  return result;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

function itemType(value: unknown): ItemType {
  if (value === 'ui' || value === 'lib' || value === 'hook' || value === 'test') {
    return value;
  }
  throw new RegistryReadError(`Unknown item type "${String(value)}"`);
}

function parseFile(raw: unknown): RegistryFile {
  if (!isRecord(raw) || typeof raw.path !== 'string' || typeof raw.content !== 'string') {
    throw new RegistryReadError('Registry file entry is malformed');
  }
  return {
    path: raw.path,
    type: itemType(raw.type),
    role: raw.role === 'test' ? 'test' : 'source',
    content: raw.content,
  };
}

function parseEntry(raw: unknown): Omit<RegistryItem, 'files'> {
  if (
    !isRecord(raw) ||
    typeof raw.name !== 'string' ||
    typeof raw.title !== 'string' ||
    typeof raw.description !== 'string' ||
    typeof raw.category !== 'string'
  ) {
    throw new RegistryReadError('Registry item is malformed');
  }
  return {
    name: raw.name,
    type: itemType(raw.type),
    category: raw.category,
    title: raw.title,
    description: raw.description,
    tier: raw.tier === 'extra' ? 'extra' : 'core',
    dependencies: stringMap(raw.dependencies),
    devDependencies: stringMap(raw.devDependencies),
    registryDependencies: stringList(raw.registryDependencies),
    testRegistryDependencies: stringList(raw.testRegistryDependencies),
  };
}

export function parseItem(raw: unknown): RegistryItem {
  const entry = parseEntry(raw);
  if (!isRecord(raw) || !Array.isArray(raw.files)) {
    throw new RegistryReadError(`Item "${entry.name}" has no files`);
  }
  return { ...entry, files: raw.files.map(parseFile) };
}

export function parseIndex(raw: unknown): RegistryIndex {
  if (!isRecord(raw) || !Array.isArray(raw.items) || typeof raw.version !== 'string') {
    throw new RegistryReadError('Registry index is malformed');
  }
  const presets = Array.isArray(raw.presets)
    ? raw.presets.flatMap((preset: unknown) => {
        if (!isRecord(preset) || typeof preset.name !== 'string' || !isRecord(preset.label)) {
          return [];
        }
        const { en, ar } = preset.label;
        return typeof en === 'string' && typeof ar === 'string'
          ? [
              {
                name: preset.name,
                label: { en, ar },
                description: typeof preset.description === 'string' ? preset.description : '',
              },
            ]
          : [];
      })
    : [];
  return {
    version: raw.version,
    presets,
    items: raw.items.map((entry: unknown) => {
      const parsed = parseEntry(entry);
      const count = isRecord(entry) && typeof entry.fileCount === 'number' ? entry.fileCount : 0;
      return { ...parsed, fileCount: count };
    }),
  };
}

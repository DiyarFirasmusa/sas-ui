/** Shapes shared by the registry builder, the CLI and the docs app. */

export const ITEM_TYPES = ['ui', 'lib', 'hook', 'test', 'block'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const CATEGORIES = [
  'foundation',
  'form',
  'overlay',
  'navigation',
  'data',
  'feedback',
  'layout',
  'display',
  'blocks',
] as const;
export type Category = (typeof CATEGORIES)[number];

/** What a contributor writes: registry/items/<name>.json. */
export interface ItemManifest {
  name: string;
  type: ItemType;
  category: Category;
  title: string;
  description: string;
  /** Source files relative to src/, e.g. "ui/button.tsx". Tests are found by convention. */
  files: string[];
  /** Phase B items that are optional extras (heavier dependencies). */
  tier?: 'core' | 'extra';
  /** Extra dev packages the item needs but cannot be found by scanning imports (test setup files, jsdom). */
  extraDevDependencies?: string[];
}

export interface ItemFile {
  /** Path relative to src/, e.g. "ui/button.tsx". */
  path: string;
  type: ItemType;
  role: 'source' | 'test';
  content: string;
}

/** What the builder emits: registry-out/items/<name>.json. */
export interface RegistryItem extends Omit<ItemManifest, 'files'> {
  /** npm packages this item imports, with the version range the registry tests against. */
  dependencies: Record<string, string>;
  /** Dev-only packages (test items import the test tooling). */
  devDependencies: Record<string, string>;
  /** Other registry items whose files this item imports. */
  registryDependencies: string[];
  /** Items only the tests import (copied with `add --tests`). */
  testRegistryDependencies: string[];
  files: ItemFile[];
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

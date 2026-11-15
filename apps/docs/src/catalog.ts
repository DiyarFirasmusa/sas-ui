import type { ItemManifest } from '../../../packages/registry/registry/schema.ts';
import type { ExampleModule } from './example-types';

function isManifest(value: unknown): value is ItemManifest {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof value.name === 'string' &&
    'category' in value &&
    typeof value.category === 'string' &&
    'files' in value &&
    Array.isArray(value.files)
  );
}

const manifestModules = import.meta.glob('../../../packages/registry/registry/items/*.json', {
  eager: true,
  import: 'default',
});
const exampleLoaders = import.meta.glob<ExampleModule>('./examples/*.tsx');
const exampleSources = import.meta.glob<string>('./examples/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export const items: ItemManifest[] = Object.values(manifestModules)
  .filter(isManifest)
  .sort((a, b) => a.title.localeCompare(b.title));

export const CATEGORY_ORDER = [
  'foundation',
  'form',
  'overlay',
  'navigation',
  'data',
  'feedback',
  'display',
  'layout',
] as const;

export function itemsByCategory(): { category: string; items: ItemManifest[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);
}

export function findItem(name: string): ItemManifest | undefined {
  return items.find((item) => item.name === name);
}

export async function loadExamples(name: string): Promise<ExampleModule | undefined> {
  const loader = exampleLoaders[`./examples/${name}.tsx`];
  return loader ? loader() : undefined;
}

export function exampleSource(name: string): string | undefined {
  return exampleSources[`./examples/${name}.tsx`];
}

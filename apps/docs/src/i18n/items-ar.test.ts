import { describe, expect, it } from 'vitest';
import { ITEMS_AR } from './items-ar';

interface Manifest {
  name: string;
  title: string;
  description: string;
}

function isManifest(value: unknown): value is Manifest {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof value.name === 'string' &&
    'title' in value &&
    typeof value.title === 'string' &&
    'description' in value &&
    typeof value.description === 'string'
  );
}

const manifests = Object.values(
  import.meta.glob('../../../../packages/registry/registry/items/*.json', {
    eager: true,
    import: 'default',
  }),
).filter(isManifest);

describe('Arabic registry item copy', () => {
  it('reads the manifests', () => {
    expect(manifests.length).toBeGreaterThan(100);
  });

  it.each(manifests.map((item) => [item.name, item] as const))(
    '%s has a translated title and description',
    (name, item) => {
      const entry = ITEMS_AR[name];
      expect(entry).toBeDefined();
      expect(entry?.title.trim()).not.toBe('');
      expect(entry?.description.trim()).not.toBe('');
      expect(entry?.title).not.toBe(item.title);
      expect(entry?.description).not.toBe(item.description);
    },
  );

  it('has no entry for an item that does not exist', () => {
    const names = new Set(manifests.map((item) => item.name));
    expect(Object.keys(ITEMS_AR).filter((name) => !names.has(name))).toEqual([]);
  });
});

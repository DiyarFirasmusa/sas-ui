import type { RegistrySource } from './registry-source.ts';
import type { RegistryItem } from './registry-types.ts';

export class UnknownItemError extends Error {
  names: string[];

  constructor(names: string[]) {
    super(`Unknown component${names.length > 1 ? 's' : ''}: ${names.join(', ')}. Run "sas-ui list" to see what exists.`);
    this.names = names;
  }
}

/**
 * Expands the requested names with everything they depend on, dependencies
 * first (so the install order is the import order). Detects unknown names up
 * front rather than failing half-way through writing files.
 */
export async function resolveItems(
  source: RegistrySource,
  requested: readonly string[],
): Promise<RegistryItem[]> {
  const index = await source.getIndex();
  const known = new Set(index.items.map((item) => item.name));
  const unknown = requested.filter((name) => !known.has(name));
  if (unknown.length > 0) {
    throw new UnknownItemError(unknown);
  }

  const ordered: RegistryItem[] = [];
  const done = new Set<string>();
  const visit = async (name: string, trail: readonly string[]): Promise<void> => {
    if (done.has(name)) {
      return;
    }
    if (trail.includes(name)) {
      throw new Error(`Circular registry dependency: ${[...trail, name].join(' → ')}`);
    }
    const item = await source.getItem(name);
    for (const dependency of item.registryDependencies) {
      await visit(dependency, [...trail, name]);
    }
    done.add(name);
    ordered.push(item);
  };
  for (const name of requested) {
    await visit(name, []);
  }
  return ordered;
}

import type { ProjectConfig } from './config.ts';

type Directories = ProjectConfig['directories'];

/** The aliases registry sources use, and the config key each one maps to. */
const SOURCE_ALIASES: readonly (readonly [string, keyof Directories])[] = [
  ['@/components/ui/', 'ui'],
  ['@/lib/', 'lib'],
  ['@/hooks/', 'hooks'],
  ['@/test/', 'test'],
  ['@/components/blocks/', 'blocks'],
];

/**
 * Rewrites the registry's `@/components/ui/x` style imports to the project's
 * alias and folders. With the defaults (`@` → src, components/ui, lib…) the
 * output is identical to the input, so the copied file is exactly the
 * registry file — nothing is transformed beyond import specifiers.
 */
export function rewriteImports(
  source: string,
  config: Pick<ProjectConfig, 'alias' | 'directories'>,
): string {
  let result = source;
  for (const [from, key] of SOURCE_ALIASES) {
    const to = `${config.alias}/${config.directories[key]}/`;
    if (to === from) {
      continue;
    }
    result = result.replaceAll(`'${from}`, `'${to}`).replaceAll(`"${from}`, `"${to}`);
  }
  return result;
}

/**
 * The inverse of `rewriteImports`: turns a project's own aliases back into the
 * registry's, so a file improved in a project can be contributed upstream.
 */
export function reverseImports(
  source: string,
  config: Pick<ProjectConfig, 'alias' | 'directories'>,
): string {
  let result = source;
  for (const [registryPrefix, key] of SOURCE_ALIASES) {
    const projectPrefix = `${config.alias}/${config.directories[key]}/`;
    if (projectPrefix === registryPrefix) {
      continue;
    }
    result = result
      .replaceAll(`'${projectPrefix}`, `'${registryPrefix}`)
      .replaceAll(`"${projectPrefix}`, `"${registryPrefix}`);
  }
  return result;
}

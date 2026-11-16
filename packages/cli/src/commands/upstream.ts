import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { readConfig } from '../config.ts';
import { color } from '../logger.ts';
import { readProjectFile, targetPath, type CommandContext } from '../project.ts';
import { openRegistry } from '../registry-source.ts';
import { reverseImports } from '../rewrite-imports.ts';

export interface UpstreamOptions {
  names: string[];
  /** The registry's `src/` folder in a checkout of the library (packages/registry/src). */
  to?: string;
  dryRun?: boolean;
}

export interface UpstreamResult {
  updated: string[];
  unchanged: string[];
  missing: string[];
}

/**
 * Copies files you improved in a project back into a checkout of the library,
 * with your aliases turned back into the registry's, so the improvement can be
 * reviewed and committed there. Only files that differ are written.
 */
export async function runUpstream(
  context: CommandContext,
  options: UpstreamOptions,
): Promise<UpstreamResult> {
  const config = readConfig(context.cwd);
  const destination = options.to ?? process.env.SAS_UI_SRC;
  if (!destination || !existsSync(destination)) {
    throw new Error(
      'Say where the library checkout is: --to <path to packages/registry/src> (or set SAS_UI_SRC).',
    );
  }
  if (options.names.length === 0) {
    throw new Error(
      'Name at least one item to send upstream, e.g. "sas-ui upstream button select".',
    );
  }
  const source = openRegistry({ flag: context.registry, configured: config.registry });
  const result: UpstreamResult = { updated: [], unchanged: [], missing: [] };

  for (const name of options.names) {
    const item = await source.getItem(name);
    for (const file of item.files.filter((entry) => entry.role === 'source')) {
      const local = readProjectFile(context.cwd, targetPath(config, file));
      if (local === undefined) {
        result.missing.push(file.path);
        continue;
      }
      const registryText = reverseImports(local, config);
      const target = join(destination, file.path);
      const current = existsSync(target) ? readFileSync(target, 'utf8') : undefined;
      if (current === registryText) {
        result.unchanged.push(file.path);
        continue;
      }
      if (options.dryRun !== true) {
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, registryText);
      }
      result.updated.push(file.path);
    }
  }

  for (const path of result.updated) {
    context.logger.success(`${options.dryRun === true ? 'Would update' : 'Updated'} ${path}`);
  }
  for (const path of result.missing) {
    context.logger.warn(`${path} is not in this project — skipped`);
  }
  context.logger.line(
    color.dim(
      `${result.updated.length} updated, ${result.unchanged.length} unchanged. Review with git diff in the library, run its tests, then commit.`,
    ),
  );
  return result;
}

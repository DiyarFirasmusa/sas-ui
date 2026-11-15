import { readConfig } from '../config.ts';
import { color } from '../logger.ts';
import { readProjectFile, renderedContent, targetPath, type CommandContext } from '../project.ts';
import { openRegistry } from '../registry-source.ts';
import { resolveItems } from '../resolve-items.ts';
import { unifiedDiff } from '../unified-diff.ts';

export interface DiffOptions {
  names: string[];
  /** Print the hunks, not just the file status. */
  verbose?: boolean;
}

export interface FileDiff {
  item: string;
  path: string;
  status: 'unchanged' | 'modified' | 'missing';
  added: number;
  removed: number;
}

/**
 * Compares the project's copies with the registry (imports rewritten to the
 * project's aliases first, so only real edits show up). Components that were
 * never added are ignored; a partly-copied component reports its missing files.
 */
export async function runDiff(context: CommandContext, options: DiffOptions): Promise<FileDiff[]> {
  const config = readConfig(context.cwd);
  const source = openRegistry({
    flag: context.registry,
    configured: config.registry,
  });
  const index = await source.getIndex();
  const names = options.names.length > 0 ? options.names : index.items.map((item) => item.name);
  const items =
    options.names.length > 0
      ? await resolveItems(source, names)
      : await Promise.all(names.map((name) => source.getItem(name)));

  const results: FileDiff[] = [];
  for (const item of items) {
    const sources = item.files.filter((file) => file.role === 'source');
    const present = sources.filter(
      (file) => readProjectFile(context.cwd, targetPath(config, file)) !== undefined,
    );
    if (present.length === 0 && options.names.length === 0) {
      continue;
    }
    for (const file of sources) {
      const path = targetPath(config, file);
      const local = readProjectFile(context.cwd, path);
      if (local === undefined) {
        results.push({
          item: item.name,
          path,
          status: 'missing',
          added: 0,
          removed: 0,
        });
        continue;
      }
      const diff = unifiedDiff(local, renderedContent(config, file));
      results.push({
        item: item.name,
        path,
        status: diff.changed ? 'modified' : 'unchanged',
        added: diff.added,
        removed: diff.removed,
      });
      if (diff.changed && options.verbose === true) {
        context.logger.line(color.bold(path));
        context.logger.line(diff.text);
        context.logger.line();
      }
    }
  }

  const changed = results.filter((result) => result.status !== 'unchanged');
  for (const result of changed) {
    const detail =
      result.status === 'modified'
        ? `+${result.added} −${result.removed} vs registry`
        : 'not in project';
    context.logger.line(
      `${result.status === 'modified' ? color.yellow('M') : color.red('?')} ${result.path} ${color.dim(detail)}`,
    );
  }
  context.logger.line(
    changed.length === 0
      ? color.green('Everything matches the registry.')
      : color.dim(
          'Lines marked "−" in --verbose output are in your copy; "+" is what the registry has now.',
        ),
  );
  return results;
}

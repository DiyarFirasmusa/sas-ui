import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CONFIG_FILE, readConfig, type ProjectConfig } from '../config.ts';
import { color } from '../logger.ts';
import { targetPath, type CommandContext } from '../project.ts';
import { openRegistry } from '../registry-source.ts';

export interface ListOptions {
  category?: string;
  installed?: boolean;
  json?: boolean;
}

function tryReadConfig(cwd: string): ProjectConfig | undefined {
  return existsSync(join(cwd, CONFIG_FILE)) ? readConfig(cwd) : undefined;
}

export async function runList(context: CommandContext, options: ListOptions): Promise<string[]> {
  const config = tryReadConfig(context.cwd);
  const source = openRegistry({ flag: context.registry, configured: config?.registry });
  const index = await source.getIndex();
  const names: string[] = [];
  const rows = await Promise.all(
    index.items
      .filter((item) => options.category === undefined || item.category === options.category)
      .map(async (item) => {
        let installed = false;
        if (config) {
          const full = await source.getItem(item.name);
          const first = full.files.find((file) => file.role === 'source');
          installed = first !== undefined && existsSync(join(context.cwd, targetPath(config, first)));
        }
        return { item, installed };
      }),
  );
  const visible = rows.filter((row) => options.installed !== true || row.installed);
  if (options.json === true) {
    context.logger.line(JSON.stringify(visible.map(({ item, installed }) => ({ ...item, installed })), null, 2));
    return visible.map(({ item }) => item.name);
  }
  const categories = [...new Set(visible.map(({ item }) => item.category))].sort();
  for (const category of categories) {
    context.logger.line(color.bold(category));
    for (const { item, installed } of visible.filter((row) => row.item.category === category)) {
      names.push(item.name);
      const mark = installed ? color.green('✔') : ' ';
      const tier = item.tier === 'extra' ? color.dim(' (extra)') : '';
      context.logger.line(`  ${mark} ${item.name.padEnd(22)} ${color.dim(item.description)}${tier}`);
    }
  }
  context.logger.line();
  context.logger.line(color.dim(`${visible.length} items · registry ${index.version} · presets: ${index.presets.map((preset) => preset.name).join(', ')}`));
  return names;
}

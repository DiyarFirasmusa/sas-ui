import { readConfig, writeConfig } from '../config.ts';
import { color } from '../logger.ts';
import { writeTokenCss, type CommandContext } from '../project.ts';
import { openRegistry } from '../registry-source.ts';

export interface ThemeOptions {
  action: 'list' | 'set';
  preset?: string;
  /** With `set`: ship every preset, switchable at runtime. */
  all?: boolean;
}

export async function runTheme(context: CommandContext, options: ThemeOptions): Promise<void> {
  const config = readConfig(context.cwd);
  const source = openRegistry({ flag: context.registry, configured: config.registry });
  const index = await source.getIndex();

  if (options.action === 'list') {
    for (const preset of index.presets) {
      const active = preset.name === config.preset ? color.green('● ') : '  ';
      context.logger.line(`${active}${preset.name.padEnd(14)} ${preset.label.en} / ${preset.label.ar} ${color.dim('— ' + preset.description)}`);
    }
    context.logger.line(color.dim(`mode: ${config.presets === 'all' ? 'all presets, runtime switching' : 'single preset'}`));
    return;
  }

  const name = options.preset;
  if (!name || !index.presets.some((preset) => preset.name === name)) {
    throw new Error(`Unknown preset "${name ?? ''}". Available: ${index.presets.map((preset) => preset.name).join(', ')}`);
  }
  const next = { ...config, preset: name, presets: options.all === true ? ('all' as const) : config.presets };
  await writeTokenCss(context.cwd, next, source);
  writeConfig(context.cwd, next);
  context.logger.success(`Preset is now "${name}"${next.presets === 'all' ? ' (all presets available at runtime via <html data-preset>)' : ''}.`);
}

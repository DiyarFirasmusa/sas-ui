import { CORE_TOKEN_GROUPS } from './token-names.ts';
import type { Preset } from './token-names.ts';

function camelCase(name: string): string {
  return name.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());
}

/** Serialises a preset to a readable, grouped TypeScript source file. */
export function presetToSource(preset: Preset, header: string): string {
  const block = (theme: Preset['light']) =>
    Object.entries(CORE_TOKEN_GROUPS)
      .map(([group, names]) => {
        const rows = names.map((name) => `    '${name}': '${theme[name]}',`);
        return `    // ${group}\n${rows.join('\n')}`;
      })
      .join('\n');
  return `${header}
import type { Preset } from '../token-names.ts';

export const ${camelCase(preset.name)}: Preset = {
  name: '${preset.name}',
  label: { en: '${preset.label.en}', ar: '${preset.label.ar}' },
  description: '${preset.description.replace(/'/g, "\\'")}',
  radius: '${preset.radius}',
  light: {
${block(preset.light)}
  },
  dark: {
${block(preset.dark)}
  },
};
`;
}

import { describe, expect, it } from 'vitest';
import { PRESETS } from './all-presets.ts';
import { checkPreset } from './contrast-checks.ts';
import { parseTokenCss, resolveVariable } from './css-parse.ts';
import { presetToCss } from './generate-css.ts';
import { importPresetFromCss, MissingTokenError } from './import-css.ts';

describe('css import', () => {
  it('reads :root and .dark blocks and ignores comments', () => {
    const { light, dark } = parseTokenCss(
      `/* --nope: red; */ :root { --a: #fff; --b: var(--a); } .dark { --a: #000; }`,
    );
    expect(light.get('a')).toBe('#fff');
    expect(resolveVariable('b', light, new Map())).toBe('#fff');
    expect(dark.get('a')).toBe('#000');
    expect(light.has('nope')).toBe(false);
  });

  it('reports the first missing token by name', () => {
    expect(() =>
      importPresetFromCss(':root { --background: #fff; }', {
        name: 'x',
        label: { en: 'x', ar: 'x' },
        description: '',
      }),
    ).toThrow(MissingTokenError);
  });

  it('round-trips a generated preset back to an identical preset', () => {
    for (const preset of PRESETS) {
      const css = presetToCss(preset, 'root');
      const reimported = importPresetFromCss(css, {
        name: preset.name,
        label: preset.label,
        description: preset.description,
        radius: preset.radius,
      });
      expect(reimported.light).toEqual(preset.light);
      expect(reimported.dark).toEqual(preset.dark);
      expect(checkPreset(reimported)).toEqual([]);
    }
  });
});

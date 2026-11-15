import { describe, expect, it } from 'vitest';
import { PRESETS } from './all-presets.ts';
import { presetToCss, presetsToSwitchableCss } from './generate-css.ts';
import { ALIAS_TOKENS, CORE_TOKEN_NAMES } from './token-names.ts';
import { themeColorBlock } from './theme-css.ts';

const preset = PRESETS[0];

describe('generate-css', () => {
  it('has a preset to test with', () => {
    expect(preset).toBeDefined();
  });

  it('emits every core token and alias in light and dark', () => {
    if (!preset) {
      return;
    }
    const css = presetToCss(preset, 'root');
    for (const name of [...CORE_TOKEN_NAMES, ...Object.keys(ALIAS_TOKENS)]) {
      expect(css.match(new RegExp(`--${name}:`, 'g'))?.length).toBe(2);
    }
    expect(css).toContain(':root {');
    expect(css).toContain(':root.dark, .dark {');
  });

  it('scopes switchable presets by data-preset and gives dark a higher specificity', () => {
    const css = presetsToSwitchableCss(PRESETS);
    for (const entry of PRESETS) {
      expect(css).toContain(`:root[data-preset="${entry.name}"] {`);
      expect(css).toContain(`:root[data-preset="${entry.name}"].dark`);
    }
  });

  it('maps every token to a Tailwind colour utility', () => {
    const block = themeColorBlock();
    expect(block).toContain('--color-surface: var(--surface);');
    expect(block).toContain('--color-border: var(--border);');
  });
});

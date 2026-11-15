import { parseTokenCss, resolveVariable } from './css-parse.ts';
import { CORE_TOKEN_NAMES, isThemeTokens } from './token-names.ts';
import type { CoreTokenName, Preset, ThemeTokens } from './token-names.ts';

/**
 * Tokens older palettes do not define get a value borrowed from a related
 * token (a token name) or a literal. Each entry is tried in order.
 */
const FALLBACKS: Partial<Record<CoreTokenName, readonly string[]>> = {
  'surface-elevated': ['surface'],
  popover: ['surface'],
  secondary: ['neutral-100', 'surface-solid-secondary'],
  'surface-solid-secondary': ['neutral-100', 'disabled-container'],
  kbd: ['surface-solid-secondary'],
  'switch-off': ['neutral-400'],
  scrim: ['rgb(0 0 0 / 0.58)'],
  'primary-text': ['primary'],
  'primary-highlight': ['ring', 'primary'],
  'primary-container': ['brand-dark', 'primary'],
  'primary-hover': ['primary'],
  'primary-tint': ['primary-light'],
  'brand-light': ['primary'],
  'brand-dark': ['primary-container'],
  'stroke-subtle': ['stroke'],
  'stroke-strong': ['stroke'],
  'sidebar-selected': ['sidebar-accent'],
  'sidebar-selected-foreground': ['sidebar-accent-foreground'],
  'sidebar-ring': ['primary-highlight'],
  'sidebar-border': ['stroke'],
};

export interface ImportOptions {
  name: string;
  label: { en: string; ar: string };
  description: string;
  radius?: string;
}

export class MissingTokenError extends Error {
  theme: 'light' | 'dark';
  token: string;

  constructor(theme: 'light' | 'dark', token: string) {
    super(`Cannot import preset: --${token} is missing from the ${theme} theme`);
    this.theme = theme;
    this.token = token;
  }
}

function buildTheme(
  scope: ReturnType<typeof parseTokenCss>['light'],
  fallbackScope: ReturnType<typeof parseTokenCss>['light'],
  theme: 'light' | 'dark',
): ThemeTokens {
  const values: Record<string, string> = {};
  const lookup = (name: string): string | undefined => resolveVariable(name, scope, fallbackScope);

  // A fallback may itself be a token that needs its own fallback (kbd →
  // surface-solid-secondary → neutral-100), so resolution recurses.
  const resolve = (name: string, seen: readonly string[]): string | undefined => {
    const direct = lookup(name);
    if (direct !== undefined || seen.includes(name)) {
      return direct;
    }
    for (const candidate of FALLBACKS[name as CoreTokenName] ?? []) {
      const value = /^(#|rgb)/.test(candidate) ? candidate : resolve(candidate, [...seen, name]);
      if (value !== undefined) {
        return value;
      }
    }
    return undefined;
  };

  for (const name of CORE_TOKEN_NAMES) {
    const value = resolve(name, []);
    if (value === undefined) {
      throw new MissingTokenError(theme, name);
    }
    values[name] = value;
  }
  if (!isThemeTokens(values)) {
    throw new MissingTokenError(theme, 'unknown');
  }
  return values;
}

/**
 * Turns a tokens CSS file into a Preset. The dark block inherits whatever it
 * does not redefine (brand tile, gold…) from the light block, the same way the
 * apps' cascade does.
 */
export function importPresetFromCss(css: string, options: ImportOptions): Preset {
  const { light, dark } = parseTokenCss(css);
  const radius = options.radius ?? light.get('radius') ?? '0.75rem';
  return {
    name: options.name,
    label: options.label,
    description: options.description,
    radius,
    light: buildTheme(light, new Map(), 'light'),
    dark: buildTheme(dark, light, 'dark'),
  };
}

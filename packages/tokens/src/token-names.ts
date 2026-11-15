/**
 * The colour token contract. Every preset defines every name in
 * CORE_TOKEN_NAMES for both its light and dark theme; the generator derives the
 * ALIAS_TOKENS (shadcn-style names such as --card or --border) from them, so a
 * preset never repeats a value that already has a home.
 *
 * The names are the ones the three SAS dashboards already use, so adopting a
 * preset in an existing app is a file swap, not a rename.
 */

export const TAG_HUES = [
  'green',
  'red',
  'yellow',
  'orange',
  'cyan',
  'purple',
  'blue',
  'neutral',
] as const;
export type TagHue = (typeof TAG_HUES)[number];

export const STATUS_NAMES = ['success', 'warning', 'danger', 'info'] as const;

const SURFACE_TOKENS = [
  'background',
  'surface',
  'surface-dim',
  'surface-elevated',
  'popover',
  'secondary',
  'hover-row',
  'surface-solid-secondary',
  'kbd',
  'switch-off',
  'scrim',
] as const;

const TEXT_TOKENS = [
  'text-primary',
  'text-secondary',
  'text-muted',
  'text-inactive',
] as const;

const BRAND_TOKENS = [
  'primary',
  'primary-foreground',
  'primary-hover',
  'primary-container',
  'primary-text',
  'primary-highlight',
  'primary-light',
  'primary-tint',
  'brand-light',
  'brand-dark',
] as const;

const BORDER_TOKENS = ['stroke', 'stroke-subtle', 'stroke-strong'] as const;

const STATUS_TOKENS = [
  'success',
  'success-foreground',
  'warning',
  'warning-foreground',
  'danger',
  'danger-foreground',
  'info',
  'info-foreground',
] as const;

const TAG_TOKENS = [
  'tag-green',
  'tag-green-container',
  'tag-red',
  'tag-red-container',
  'tag-yellow',
  'tag-yellow-container',
  'tag-orange',
  'tag-orange-container',
  'tag-cyan',
  'tag-cyan-container',
  'tag-purple',
  'tag-purple-container',
  'tag-blue',
  'tag-blue-container',
  'tag-neutral',
  'tag-neutral-container',
] as const;

const NEUTRAL_TOKENS = [
  'neutral-700',
  'neutral-600',
  'neutral-500',
  'neutral-400',
  'neutral-300',
  'neutral-200',
  'neutral-50',
] as const;

const SIDEBAR_TOKENS = [
  'sidebar',
  'sidebar-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-selected',
  'sidebar-selected-foreground',
  'sidebar-border',
  'sidebar-ring',
] as const;

const ACCENT_TOKENS = [
  'gold',
  'coral',
  'auth-panel-from',
  'auth-panel-to',
  'brand-tile',
  'brand-tile-foreground',
] as const;

const CHART_TOKENS = [
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
] as const;

export const CORE_TOKEN_GROUPS = {
  surfaces: SURFACE_TOKENS,
  text: TEXT_TOKENS,
  brand: BRAND_TOKENS,
  borders: BORDER_TOKENS,
  status: STATUS_TOKENS,
  tags: TAG_TOKENS,
  neutral: NEUTRAL_TOKENS,
  sidebar: SIDEBAR_TOKENS,
  accents: ACCENT_TOKENS,
  charts: CHART_TOKENS,
} as const;

export const CORE_TOKEN_NAMES = [
  ...SURFACE_TOKENS,
  ...TEXT_TOKENS,
  ...BRAND_TOKENS,
  ...BORDER_TOKENS,
  ...STATUS_TOKENS,
  ...TAG_TOKENS,
  ...NEUTRAL_TOKENS,
  ...SIDEBAR_TOKENS,
  ...ACCENT_TOKENS,
  ...CHART_TOKENS,
] as const;

export type CoreTokenName = (typeof CORE_TOKEN_NAMES)[number];

/** One theme (light or dark) of a preset: every core token has a value. */
export type ThemeTokens = Record<CoreTokenName, string>;

/**
 * Derived tokens. Each maps to the core token it follows (a `var()` reference),
 * so the active theme resolves them. They exist for shadcn-style utilities
 * (`bg-card`, `border-border`, `ring-ring`) and for the existing apps' names.
 */
export const ALIAS_TOKENS: Record<string, CoreTokenName> = {
  brand: 'primary',
  border: 'stroke',
  input: 'stroke',
  'surface-border': 'stroke',
  destructive: 'danger',
  foreground: 'text-primary',
  card: 'surface',
  'card-foreground': 'text-primary',
  'popover-foreground': 'text-primary',
  muted: 'secondary',
  'secondary-foreground': 'text-primary',
  'muted-foreground': 'text-secondary',
  accent: 'primary-light',
  'accent-foreground': 'primary-text',
  ring: 'primary-highlight',
  'disabled-container': 'surface-solid-secondary',
  'neutral-100': 'surface-solid-secondary',
  'sidebar-active': 'sidebar-accent',
};

export interface Preset {
  /** Stable id: used in `data-preset`, the CLI and file names. */
  name: string;
  label: { en: string; ar: string };
  description: string;
  /** Base corner radius (--radius). */
  radius: string;
  light: ThemeTokens;
  dark: ThemeTokens;
}

/** Narrows a loose record to a complete theme (every core token present). */
export function isThemeTokens(
  record: Record<string, string>,
): record is ThemeTokens {
  return CORE_TOKEN_NAMES.every((name) => typeof record[name] === 'string');
}

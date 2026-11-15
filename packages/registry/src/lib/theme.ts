import { directionOf, type Direction, type Locale } from '@/lib/locale';

/**
 * Runtime theming contract, mirrored from @sas-ui/tokens (apply-preset.ts):
 * the CSS of every preset is already on the page, scoped by `data-preset`, and
 * dark mode is the `dark` class, so switching is attribute writes — no
 * stylesheet swap and no flash. Storage keys are shared with that package so
 * an app can mix both. Storage is a convenience: every access is wrapped.
 */

export type ColorMode = 'light' | 'dark' | 'system';

export const PRESET_STORAGE_KEY = 'sas-ui:preset';
export const MODE_STORAGE_KEY = 'sas-ui:mode';
export const LOCALE_STORAGE_KEY = 'sas-ui:locale';

export const COLOR_MODES: readonly ColorMode[] = ['light', 'dark', 'system'];

export function isColorMode(value: unknown): value is ColorMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function isLocale(value: unknown): value is Locale {
  return value === 'ar' || value === 'en';
}

function readStorage(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Private windows and blocked storage must not break theming.
  }
}

/** The stored preset when it is still one of `allowed`, otherwise `fallback`. */
export function getStoredPreset(fallback: string, allowed?: readonly string[]): string {
  const stored = readStorage(PRESET_STORAGE_KEY);
  if (stored === null || (allowed !== undefined && !allowed.includes(stored))) {
    return fallback;
  }
  return stored;
}

export function getStoredMode(fallback: ColorMode = 'system'): ColorMode {
  const stored = readStorage(MODE_STORAGE_KEY);
  return isColorMode(stored) ? stored : fallback;
}

export function getStoredLocale(fallback: Locale): Locale {
  const stored = readStorage(LOCALE_STORAGE_KEY);
  return isLocale(stored) ? stored : fallback;
}

export function storePreset(name: string): void {
  writeStorage(PRESET_STORAGE_KEY, name);
}

export function storeMode(mode: ColorMode): void {
  writeStorage(MODE_STORAGE_KEY, mode);
}

export function storeLocale(locale: Locale): void {
  writeStorage(LOCALE_STORAGE_KEY, locale);
}

export const DARK_QUERY = '(prefers-color-scheme: dark)';

export function systemPrefersDark(): boolean {
  return globalThis.matchMedia?.(DARK_QUERY).matches ?? false;
}

/** `system` follows the OS; the other two modes are already concrete. */
export function resolveMode(mode: ColorMode, systemDark: boolean): 'light' | 'dark' {
  if (mode === 'system') {
    return systemDark ? 'dark' : 'light';
  }
  return mode;
}

export function applyPreset(name: string, root: HTMLElement = document.documentElement): void {
  root.dataset.preset = name;
}

export function applyMode(
  resolved: 'light' | 'dark',
  root: HTMLElement = document.documentElement,
): void {
  root.classList.toggle('dark', resolved === 'dark');
  // Native controls (scrollbars, date pickers) follow the theme too.
  root.style.colorScheme = resolved;
}

/** Direction and language live on <html> so every component inherits them. */
export function applyLocale(locale: Locale, root: HTMLElement = document.documentElement): Direction {
  const direction = directionOf(locale);
  root.dir = direction;
  root.lang = locale;
  return direction;
}

/** Embeds a value in an inline script: JSON quoting plus `<` escaped so it cannot close the tag. */
function quote(value: string): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

/**
 * Inline script for <head> that applies the stored preset, mode and language
 * before first paint. Put it in index.html (or a `<script dangerouslySetInnerHTML>`)
 * to avoid a flash of the wrong theme.
 */
export function noFlashScript(defaultPreset: string, defaultLocale: Locale = 'en'): string {
  return (
    '(function(){try{' +
    'var d=document.documentElement;' +
    `var p=localStorage.getItem(${quote(PRESET_STORAGE_KEY)})||${quote(defaultPreset)};` +
    "d.setAttribute('data-preset',p);" +
    `var m=localStorage.getItem(${quote(MODE_STORAGE_KEY)})||'system';` +
    "var k=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);" +
    "if(k){d.classList.add('dark');}d.style.colorScheme=k?'dark':'light';" +
    `var l=localStorage.getItem(${quote(LOCALE_STORAGE_KEY)})||${quote(defaultLocale)};` +
    "if(l!=='ar'&&l!=='en'){l=" +
    quote(defaultLocale) +
    ';}' +
    "d.lang=l;d.dir=l==='ar'?'rtl':'ltr';" +
    '}catch(e){}})();'
  );
}

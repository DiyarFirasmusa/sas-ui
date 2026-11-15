/**
 * Runtime switching. The CSS for every preset is already on the page, scoped
 * by `data-preset`, so switching is two attribute writes — no stylesheet swap,
 * no flash. Storage is optional and wrapped: private windows and blocked
 * storage must not break theming.
 */

export type ColorMode = 'light' | 'dark' | 'system';

export const PRESET_STORAGE_KEY = 'sas-ui:preset';
export const MODE_STORAGE_KEY = 'sas-ui:mode';

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
    // Storage is a convenience; ignoring a failed write is intentional.
  }
}

export function getStoredPreset(fallback: string): string {
  return readStorage(PRESET_STORAGE_KEY) ?? fallback;
}

export function getStoredMode(): ColorMode {
  const stored = readStorage(MODE_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

export function applyPreset(name: string, root: HTMLElement = document.documentElement): void {
  root.dataset.preset = name;
  writeStorage(PRESET_STORAGE_KEY, name);
}

function prefersDark(): boolean {
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function applyMode(mode: ColorMode, root: HTMLElement = document.documentElement): void {
  const isDark = mode === 'dark' || (mode === 'system' && prefersDark());
  root.classList.toggle('dark', isDark);
  writeStorage(MODE_STORAGE_KEY, mode);
}

/** Direction and language live on <html> so every component inherits them. */
export function applyDirection(
  direction: 'rtl' | 'ltr',
  language: string,
  root: HTMLElement = document.documentElement,
): void {
  root.dir = direction;
  root.lang = language;
}

/**
 * Inline script for <head> that applies the stored preset and mode before
 * first paint. Embed it as text in index.html to avoid a flash of the wrong
 * theme.
 */
export function noFlashScript(defaultPreset: string): string {
  return `(function(){try{var d=document.documentElement;var p=localStorage.getItem('${PRESET_STORAGE_KEY}')||'${defaultPreset}';d.setAttribute('data-preset',p);var m=localStorage.getItem('${MODE_STORAGE_KEY}')||'system';if(m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))d.classList.add('dark');}catch(e){}})();`;
}

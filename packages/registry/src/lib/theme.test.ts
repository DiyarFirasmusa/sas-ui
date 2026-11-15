import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LOCALE_STORAGE_KEY,
  MODE_STORAGE_KEY,
  PRESET_STORAGE_KEY,
  applyLocale,
  applyMode,
  applyPreset,
  getStoredLocale,
  getStoredMode,
  getStoredPreset,
  isColorMode,
  noFlashScript,
  resolveMode,
  storeLocale,
  storeMode,
  storePreset,
} from '@/lib/theme';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-preset');
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = '';
});

describe('storage', () => {
  it('uses the shared tokens-package keys', () => {
    expect(PRESET_STORAGE_KEY).toBe('sas-ui:preset');
    expect(MODE_STORAGE_KEY).toBe('sas-ui:mode');
  });

  it('falls back when nothing is stored', () => {
    expect(getStoredPreset('hr')).toBe('hr');
    expect(getStoredMode()).toBe('system');
    expect(getStoredLocale('ar')).toBe('ar');
  });

  it('round-trips stored values', () => {
    storePreset('inventory');
    storeMode('dark');
    storeLocale('en');
    expect(getStoredPreset('hr')).toBe('inventory');
    expect(getStoredMode()).toBe('dark');
    expect(getStoredLocale('ar')).toBe('en');
  });

  it('ignores stored values that are no longer valid', () => {
    localStorage.setItem(PRESET_STORAGE_KEY, 'removed');
    localStorage.setItem(MODE_STORAGE_KEY, 'sepia');
    localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
    expect(getStoredPreset('hr', ['hr', 'inventory'])).toBe('hr');
    expect(getStoredMode('light')).toBe('light');
    expect(getStoredLocale('en')).toBe('en');
  });

  it('survives storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getStoredPreset('hr')).toBe('hr');
    expect(getStoredMode()).toBe('system');
    expect(() => storePreset('x')).not.toThrow();
    expect(() => storeMode('dark')).not.toThrow();
  });
});

describe('resolveMode', () => {
  it('follows the system only in system mode', () => {
    expect(resolveMode('system', true)).toBe('dark');
    expect(resolveMode('system', false)).toBe('light');
    expect(resolveMode('light', true)).toBe('light');
    expect(resolveMode('dark', false)).toBe('dark');
  });

  it('recognises valid modes', () => {
    expect(isColorMode('dark')).toBe(true);
    expect(isColorMode('auto')).toBe(false);
    expect(isColorMode(null)).toBe(false);
  });
});

describe('DOM application', () => {
  it('writes data-preset', () => {
    applyPreset('wine-lapis');
    expect(document.documentElement.dataset.preset).toBe('wine-lapis');
  });

  it('toggles the dark class and colour scheme', () => {
    applyMode('dark');
    expect(document.documentElement).toHaveClass('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    applyMode('light');
    expect(document.documentElement).not.toHaveClass('dark');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('writes dir and lang from the locale', () => {
    expect(applyLocale('ar')).toBe('rtl');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(applyLocale('en')).toBe('ltr');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('can target another root element', () => {
    const root = document.createElement('div');
    applyPreset('hr', root);
    expect(root.dataset.preset).toBe('hr');
  });
});

describe('noFlashScript', () => {
  function run(script: string) {
    // The script is meant to be executed as a classic inline script.
    new Function(script)();
  }

  it('applies stored values before paint', () => {
    localStorage.setItem(PRESET_STORAGE_KEY, 'inventory');
    localStorage.setItem(MODE_STORAGE_KEY, 'dark');
    localStorage.setItem(LOCALE_STORAGE_KEY, 'ar');
    run(noFlashScript('hr'));
    const root = document.documentElement;
    expect(root.dataset.preset).toBe('inventory');
    expect(root).toHaveClass('dark');
    expect(root.dir).toBe('rtl');
    expect(root.lang).toBe('ar');
  });

  it('uses the defaults when storage is empty', () => {
    run(noFlashScript('hr', 'ar'));
    expect(document.documentElement.dataset.preset).toBe('hr');
    expect(document.documentElement).not.toHaveClass('dark');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('ignores an unknown stored language', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
    run(noFlashScript('hr', 'en'));
    expect(document.documentElement.lang).toBe('en');
  });

  it('cannot be broken out of by a hostile preset name', () => {
    const script = noFlashScript('</script><script>alert(1)</script>');
    expect(script).not.toContain('</script>');
  });
});

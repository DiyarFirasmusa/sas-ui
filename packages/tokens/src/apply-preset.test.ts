// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyDirection,
  applyMode,
  applyPreset,
  getStoredMode,
  getStoredPreset,
  noFlashScript,
} from './apply-preset.ts';

describe('apply-preset', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-preset');
    document.documentElement.className = '';
  });

  it('writes data-preset and remembers it', () => {
    applyPreset('hr');
    expect(document.documentElement.dataset.preset).toBe('hr');
    expect(getStoredPreset('neutral')).toBe('hr');
  });

  it('falls back when nothing is stored', () => {
    expect(getStoredPreset('neutral')).toBe('neutral');
    expect(getStoredMode()).toBe('system');
  });

  it('toggles the dark class from the chosen mode', () => {
    applyMode('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    applyMode('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('sets direction and language together', () => {
    applyDirection('rtl', 'ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
  });

  it('keeps working when storage throws', () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('blocked');
    };
    expect(() => applyPreset('hr')).not.toThrow();
    Storage.prototype.setItem = original;
  });

  it('emits a no-flash script that names the default preset', () => {
    expect(noFlashScript('neutral')).toContain("'neutral'");
  });
});

import { describe, expect, it } from 'vitest';
import { defaultCommandFilter, normalizeSearchText } from '@/lib/command-filter';

describe('normalizeSearchText', () => {
  it('lowercases and strips Latin accents', () => {
    expect(normalizeSearchText('  Café ')).toBe('cafe');
  });

  it('strips Arabic diacritics and tatweel', () => {
    expect(normalizeSearchText('مُحَمَّد')).toBe(normalizeSearchText('محمد'));
    expect(normalizeSearchText('كـتـاب')).toBe('كتاب');
  });

  it('treats alef and ya variants as equal', () => {
    expect(normalizeSearchText('أحمد')).toBe(normalizeSearchText('احمد'));
    expect(normalizeSearchText('إسلام')).toBe(normalizeSearchText('اسلام'));
    expect(normalizeSearchText('مصطفى')).toBe(normalizeSearchText('مصطفي'));
  });
});

describe('defaultCommandFilter', () => {
  it('matches everything for an empty search', () => {
    expect(defaultCommandFilter('Open file', '', [])).toBe(1);
    expect(defaultCommandFilter('Open file', '   ', [])).toBe(1);
  });

  it('ranks prefix matches above inner matches and rejects misses', () => {
    expect(defaultCommandFilter('Open file', 'op', [])).toBe(1);
    expect(defaultCommandFilter('Open file', 'file', [])).toBe(0.5);
    expect(defaultCommandFilter('Open file', 'zzz', [])).toBe(0);
  });

  it('requires every word to match, in any order', () => {
    expect(defaultCommandFilter('Open recent file', 'file open', [])).toBeGreaterThan(0);
    expect(defaultCommandFilter('Open recent file', 'open save', [])).toBe(0);
  });

  it('also searches keywords', () => {
    expect(
      defaultCommandFilter('Settings', 'preferences', ['preferences', 'options']),
    ).toBeGreaterThan(0);
  });

  it('matches Arabic regardless of diacritics and alef form', () => {
    expect(defaultCommandFilter('أنشئ مستنداً', 'انشئ', [])).toBeGreaterThan(0);
    expect(defaultCommandFilter('الإعدادات', 'الاعدادات', [])).toBeGreaterThan(0);
  });
});

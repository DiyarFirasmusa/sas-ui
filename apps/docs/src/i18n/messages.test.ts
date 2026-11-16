import { describe, expect, it } from 'vitest';
import { DOC_SLUGS } from '../use-hash-route';
import { DOC_TITLE_KEYS, messages } from './messages';
import { interpolate, translate } from './use-t';

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('docs messages', () => {
  it('has the same keys in English and Arabic', () => {
    expect(Object.keys(messages.ar).sort()).toEqual(Object.keys(messages.en).sort());
  });

  it.each(['en', 'ar'] as const)('has no empty strings in %s', (locale) => {
    const empty = Object.entries(messages[locale]).filter(([, text]) => text.trim() === '');
    expect(empty).toEqual([]);
  });

  it('uses the same {placeholders} in both languages', () => {
    for (const [key, text] of Object.entries(messages.en)) {
      const arabic = messages.ar[key as keyof typeof messages.ar];
      expect(placeholders(arabic), key).toEqual(placeholders(text));
    }
  });

  it('really translates: Arabic text differs from English for the chrome strings', () => {
    const same = Object.entries(messages.en)
      .filter(([key, text]) => messages.ar[key as keyof typeof messages.ar] === text)
      .map(([key]) => key);
    // brand-like words may legitimately match; none of the prose should
    expect(same).toEqual([]);
  });

  it('names every docs page', () => {
    expect(Object.keys(DOC_TITLE_KEYS).sort()).toEqual([...DOC_SLUGS].sort());
  });

  it('interpolates {count}-style values and leaves unknown placeholders alone', () => {
    expect(interpolate('{count} items', { count: 3 })).toBe('3 items');
    expect(interpolate('{a} {b}', { a: 'x' })).toBe('x {b}');
    expect(translate('ar', 'component.previous', { title: 'زر' })).toBe('السابق: زر');
  });
});

import { describe, expect, it } from 'vitest';
import { fillTemplate, formatCount } from '@/lib/format-message';

describe('fillTemplate', () => {
  it('replaces every placeholder, including repeats', () => {
    expect(fillTemplate('{a} of {b} ({a})', { a: 1, b: 'two' })).toBe('1 of two (1)');
  });

  it('keeps placeholders it has no value for', () => {
    expect(fillTemplate('Page {page} of {count}', { page: 2 })).toBe('Page 2 of {count}');
  });

  it('leaves text without placeholders alone', () => {
    expect(fillTemplate('Plain', { a: 1 })).toBe('Plain');
  });

  it('accepts zero as a value', () => {
    expect(fillTemplate('{n} rows', { n: 0 })).toBe('0 rows');
  });
});

describe('formatCount', () => {
  it('groups thousands with Latin digits', () => {
    expect(formatCount(1234567)).toBe('1,234,567');
    expect(formatCount(0)).toBe('0');
  });

  it('never produces Arabic-Indic digits', () => {
    expect(formatCount(2024)).toMatch(/^[0-9,]+$/);
  });
});

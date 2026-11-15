import { describe, expect, it } from 'vitest';
import {
  fillLabel,
  optionFor,
  rememberOptions,
  withSelected,
  type ComboboxOption,
} from '@/lib/combobox-options';

const a: ComboboxOption = { value: 'a', label: 'Alpha' };
const b: ComboboxOption = { value: 'b', label: 'Beta' };

describe('fillLabel', () => {
  it('replaces named placeholders', () => {
    expect(fillLabel('+{count} more', { count: 3 })).toBe('+3 more');
    expect(fillLabel('إزالة {label}', { label: 'مصر' })).toBe('إزالة مصر');
  });

  it('replaces every occurrence and keeps unknown placeholders', () => {
    expect(fillLabel('{n}/{n} {other}', { n: 2 })).toBe('2/2 {other}');
  });
});

describe('option memory', () => {
  it('remembers options across lists and ignores undefined lists', () => {
    const memory = new Map<string, ComboboxOption>();
    rememberOptions(memory, [a], undefined, [b]);
    expect([...memory.keys()]).toEqual(['a', 'b']);
  });

  it('keeps the latest option for a value', () => {
    const memory = new Map<string, ComboboxOption>();
    rememberOptions(memory, [a]);
    rememberOptions(memory, [{ value: 'a', label: 'Alpha 2' }]);
    expect(optionFor(memory, 'a').label).toBe('Alpha 2');
  });

  it('falls back to the raw value for an unknown option', () => {
    expect(optionFor(new Map(), 'zz')).toEqual({ value: 'zz', label: 'zz' });
  });
});

describe('withSelected', () => {
  it('appends selected options that are missing from the results', () => {
    expect(withSelected([a], [b])).toEqual([a, b]);
  });

  it('does not duplicate options already present', () => {
    expect(withSelected([a, b], [b])).toEqual([a, b]);
  });

  it('returns the options unchanged when nothing is selected', () => {
    expect(withSelected([a], [])).toEqual([a]);
  });
});

import { describe, expect, it } from 'vitest';
import { FIELD_OPERATORS } from '@/lib/filter-builder';
import { errorLabel, filterBuilderMessages, operatorLabel } from '@/lib/filter-builder-messages';
import type { FilterRuleError } from '@/lib/filter-builder-validate';

const errors: FilterRuleError[] = [
  'unknown_field',
  'invalid_operator',
  'required',
  'invalid_number',
  'invalid_date',
  'invalid_range',
  'invalid_days',
  'invalid_option',
];

describe('filterBuilderMessages', () => {
  it('has the same keys in English and Arabic', () => {
    expect(Object.keys(filterBuilderMessages.ar).sort()).toEqual(
      Object.keys(filterBuilderMessages.en).sort(),
    );
  });

  it('has no empty label', () => {
    for (const locale of [filterBuilderMessages.en, filterBuilderMessages.ar]) {
      for (const label of Object.values(locale)) {
        expect(label.trim()).not.toBe('');
      }
    }
  });

  it('names every operator of every field type', () => {
    for (const locale of [filterBuilderMessages.en, filterBuilderMessages.ar]) {
      for (const operator of Object.values(FIELD_OPERATORS).flat()) {
        expect(operatorLabel(locale, operator)).toBe(locale[`operator_${operator}`]);
      }
    }
  });

  it('explains every validation error', () => {
    for (const locale of [filterBuilderMessages.en, filterBuilderMessages.ar]) {
      for (const error of errors) {
        expect(errorLabel(locale, error)).toBe(locale[`error_${error}`]);
      }
    }
  });

  it('keeps the {n} placeholder in the summary in both languages', () => {
    expect(filterBuilderMessages.en.invalidSummary).toContain('{n}');
    expect(filterBuilderMessages.ar.invalidSummary).toContain('{n}');
  });
});

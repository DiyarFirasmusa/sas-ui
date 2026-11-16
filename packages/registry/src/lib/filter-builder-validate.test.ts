import { describe, expect, it } from 'vitest';
import {
  createGroup,
  type FilterField,
  type FilterOperator,
  type FilterRule,
} from '@/lib/filter-builder';
import { checkValue, validateGroup, validateRule } from '@/lib/filter-builder-validate';

const fields: FilterField[] = [
  { id: 'name', label: 'Name', type: 'text' },
  { id: 'amount', label: 'Amount', type: 'number' },
  { id: 'created', label: 'Created', type: 'date' },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'new', label: 'New' },
      { value: 'done', label: 'Done' },
    ],
  },
  { id: 'free', label: 'Free choice', type: 'select' },
  { id: 'active', label: 'Active', type: 'boolean' },
];

function rule(
  id: string,
  fieldId: string,
  operator: FilterOperator,
  value: FilterRule['value'],
): FilterRule {
  return { id, field: fieldId, operator, value };
}

describe('checkValue', () => {
  it('needs text for text operators', () => {
    expect(checkValue('contains', 'x')).toBeNull();
    expect(checkValue('contains', '')).toBe('required');
    expect(checkValue('contains', '   ')).toBe('required');
    expect(checkValue('contains', null)).toBe('required');
    expect(checkValue('is_empty', null)).toBeNull();
  });

  it('needs a finite number for number operators', () => {
    expect(checkValue('eq', 0)).toBeNull();
    expect(checkValue('eq', null)).toBe('required');
    expect(checkValue('eq', Number.NaN)).toBe('invalid_number');
    expect(checkValue('eq', Number.POSITIVE_INFINITY)).toBe('invalid_number');
    expect(checkValue('eq', '5')).toBe('invalid_number');
  });

  it('needs a whole, non-negative number of days', () => {
    expect(checkValue('in_last', 30)).toBeNull();
    expect(checkValue('in_last', 0)).toBeNull();
    expect(checkValue('in_last', null)).toBe('required');
    expect(checkValue('in_last', 1.5)).toBe('invalid_days');
    expect(checkValue('in_last', -1)).toBe('invalid_days');
  });

  it('needs a real ISO date for date operators', () => {
    expect(checkValue('on', '2024-02-29')).toBeNull();
    expect(checkValue('on', '')).toBe('required');
    expect(checkValue('on', null)).toBe('required');
    expect(checkValue('on', '2023-02-29')).toBe('invalid_date');
    expect(checkValue('on', '05/03/2024')).toBe('invalid_date');
  });

  it('checks ranges for both ends, type and order', () => {
    expect(checkValue('between', { from: 1, to: 2 }, 'number')).toBeNull();
    expect(checkValue('between', { from: 2, to: 2 }, 'number')).toBeNull();
    expect(checkValue('between', { from: 1, to: null }, 'number')).toBe('required');
    expect(checkValue('between', { from: null, to: null })).toBe('required');
    expect(checkValue('between', { from: 3, to: 2 }, 'number')).toBe('invalid_range');
    expect(checkValue('between', { from: '2024-01-01', to: '2024-01-31' }, 'date')).toBeNull();
    expect(checkValue('between', { from: '2024-02-01', to: '2024-01-31' }, 'date')).toBe(
      'invalid_range',
    );
    expect(checkValue('between', { from: '2024-13-01', to: '2024-14-01' }, 'date')).toBe(
      'invalid_date',
    );
    expect(checkValue('between', { from: 1, to: 2 }, 'date')).toBe('invalid_date');
    expect(checkValue('between', { from: '1', to: '2' }, 'number')).toBe('invalid_number');
    expect(checkValue('between', 'x')).toBe('required');
  });

  it('infers the range type from the value when no field type is given', () => {
    expect(checkValue('between', { from: 1, to: 2 })).toBeNull();
    expect(checkValue('between', { from: '2024-01-01', to: '2024-01-02' })).toBeNull();
  });

  it('needs an option, or a non-empty list of options', () => {
    expect(checkValue('is', 'new')).toBeNull();
    expect(checkValue('is', null)).toBe('required');
    expect(checkValue('is', '')).toBe('required');
    expect(checkValue('is', 3)).toBe('invalid_option');
    expect(checkValue('is_any_of', ['a'])).toBeNull();
    expect(checkValue('is_any_of', [])).toBe('required');
    expect(checkValue('is_any_of', null)).toBe('required');
    expect(checkValue('is_any_of', 'a')).toBe('invalid_option');
  });
});

describe('validateRule and validateGroup', () => {
  it('flags unknown fields and operators the field does not allow', () => {
    expect(validateRule(rule('a', 'gone', 'contains', 'x'), fields)).toBe('unknown_field');
    expect(validateRule(rule('a', 'amount', 'contains', 'x'), fields)).toBe('invalid_operator');
    expect(validateRule(rule('a', 'name', 'gt', 3), fields)).toBe('invalid_operator');
  });

  it('flags options the select field does not offer', () => {
    expect(validateRule(rule('a', 'status', 'is', 'new'), fields)).toBeNull();
    expect(validateRule(rule('a', 'status', 'is', 'archived'), fields)).toBe('invalid_option');
    expect(validateRule(rule('a', 'status', 'is_any_of', ['new', 'archived']), fields)).toBe(
      'invalid_option',
    );
    expect(validateRule(rule('a', 'free', 'is', 'whatever'), fields)).toBeNull();
  });

  it('reports one error per invalid rule id and skips valid ones', () => {
    const group = createGroup('and', [
      rule('ok', 'name', 'contains', 'ali'),
      rule('empty', 'name', 'contains', ''),
      createGroup('or', [
        rule('bad-range', 'amount', 'between', { from: 5, to: 1 }),
        rule('nested-ok', 'active', 'is_true', null),
        rule('ghost', 'gone', 'is', 'x'),
      ]),
    ]);
    expect(validateGroup(group, fields)).toEqual({
      empty: 'required',
      'bad-range': 'invalid_range',
      ghost: 'unknown_field',
    });
  });

  it('accepts an empty group and a fully valid one', () => {
    expect(validateGroup(createGroup(), fields)).toEqual({});
    expect(
      validateGroup(
        createGroup('and', [
          rule('1', 'created', 'in_last', 7),
          rule('2', 'status', 'is_any_of', ['new', 'done']),
        ]),
        fields,
      ),
    ).toEqual({});
  });

  it('accepts Arabic text values', () => {
    expect(validateRule(rule('a', 'name', 'contains', 'أحمد'), fields)).toBeNull();
  });
});

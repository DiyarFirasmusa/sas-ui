import { describe, expect, it } from 'vitest';
import {
  createGroup,
  type FilterGroup,
  type FilterOperator,
  type FilterValue,
} from '@/lib/filter-builder';
import { evaluate, type FieldAccessors } from '@/lib/filter-builder-evaluate';

interface Row {
  name?: string | null;
  amount?: number | string | null;
  created?: string | Date | null;
  status?: string | string[] | null;
  active?: boolean | string | null;
}

const accessors: FieldAccessors<Row> = {
  name: (row) => row.name,
  amount: (row) => row.amount,
  created: (row) => row.created,
  status: (row) => row.status,
  active: (row) => row.active,
};

let counter = 0;
function one(field: string, operator: FilterOperator, value: FilterValue): FilterGroup {
  counter += 1;
  return createGroup('and', [{ id: `r${counter}`, field, operator, value }]);
}

function matches(group: FilterGroup, row: Row, today = '2024-03-15'): boolean {
  return evaluate(group, row, accessors, { today });
}

describe('evaluate text', () => {
  it('contains, not contains, equals, starts with', () => {
    const row = { name: 'Ali Hassan' };
    expect(matches(one('name', 'contains', 'hass'), row)).toBe(true);
    expect(matches(one('name', 'contains', 'zzz'), row)).toBe(false);
    expect(matches(one('name', 'not_contains', 'zzz'), row)).toBe(true);
    expect(matches(one('name', 'not_contains', 'ali'), row)).toBe(false);
    expect(matches(one('name', 'equals', 'ali hassan'), row)).toBe(true);
    expect(matches(one('name', 'equals', 'ali'), row)).toBe(false);
    expect(matches(one('name', 'starts_with', 'AL'), row)).toBe(true);
    expect(matches(one('name', 'starts_with', 'has'), row)).toBe(false);
  });

  it('ignores Latin case and accents', () => {
    expect(matches(one('name', 'contains', 'cafe'), { name: 'Café Noir' })).toBe(true);
    expect(matches(one('name', 'equals', 'CAFÉ'), { name: 'cafe' })).toBe(true);
  });

  it('is empty for missing, blank or mark-only text', () => {
    expect(matches(one('name', 'is_empty', null), { name: null })).toBe(true);
    expect(matches(one('name', 'is_empty', null), {})).toBe(true);
    expect(matches(one('name', 'is_empty', null), { name: '  ​ ' })).toBe(true);
    expect(matches(one('name', 'is_empty', null), { name: 'x' })).toBe(false);
  });

  it('treats a missing value as not containing anything', () => {
    expect(matches(one('name', 'not_contains', 'x'), { name: null })).toBe(true);
    expect(matches(one('name', 'contains', 'x'), { name: null })).toBe(false);
  });
});

describe('evaluate Arabic text', () => {
  it('ignores diacritics', () => {
    expect(matches(one('name', 'contains', 'محمد'), { name: 'مُحَمَّد علي' })).toBe(true);
    expect(matches(one('name', 'starts_with', 'مُحَمَّد'), { name: 'محمد علي' })).toBe(true);
  });

  it('ignores alef forms and alef maksura', () => {
    expect(matches(one('name', 'contains', 'احمد'), { name: 'أحمد' })).toBe(true);
    expect(matches(one('name', 'equals', 'أحمد'), { name: 'احمد' })).toBe(true);
    expect(matches(one('name', 'contains', 'إسلام'), { name: 'اسلام' })).toBe(true);
    expect(matches(one('name', 'contains', 'مصطفى'), { name: 'مصطفي' })).toBe(true);
  });

  it('ignores tatweel', () => {
    expect(matches(one('name', 'equals', 'كتاب'), { name: 'كـتـاب' })).toBe(true);
  });

  it('treats Arabic-Indic and Latin digits as the same', () => {
    expect(matches(one('name', 'contains', 'فاتورة ١٢٣'), { name: 'فاتورة 123' })).toBe(true);
    expect(matches(one('name', 'contains', 'INV-123'), { name: 'inv-١٢٣' })).toBe(true);
    expect(matches(one('name', 'contains', '۱۲۳'), { name: '٠١٢٣' })).toBe(true);
  });

  it('keeps taa marbuta strict unless the option asks to fold it', () => {
    const group = one('name', 'equals', 'مدرسه');
    expect(matches(group, { name: 'مدرسة' })).toBe(false);
    expect(
      evaluate(group, { name: 'مدرسة' }, accessors, { normalize: { foldTaMarbuta: true } }),
    ).toBe(true);
  });
});

describe('evaluate numbers', () => {
  it('compares with every operator', () => {
    const row = { amount: 10 };
    expect(matches(one('amount', 'eq', 10), row)).toBe(true);
    expect(matches(one('amount', 'eq', 11), row)).toBe(false);
    expect(matches(one('amount', 'neq', 11), row)).toBe(true);
    expect(matches(one('amount', 'gt', 9), row)).toBe(true);
    expect(matches(one('amount', 'gt', 10), row)).toBe(false);
    expect(matches(one('amount', 'gte', 10), row)).toBe(true);
    expect(matches(one('amount', 'lt', 11), row)).toBe(true);
    expect(matches(one('amount', 'lt', 10), row)).toBe(false);
    expect(matches(one('amount', 'lte', 10), row)).toBe(true);
  });

  it('between is inclusive at both ends', () => {
    const group = one('amount', 'between', { from: 5, to: 10 });
    expect(matches(group, { amount: 5 })).toBe(true);
    expect(matches(group, { amount: 10 })).toBe(true);
    expect(matches(group, { amount: 7.5 })).toBe(true);
    expect(matches(group, { amount: 4.99 })).toBe(false);
    expect(matches(group, { amount: 10.01 })).toBe(false);
  });

  it('reads numeric strings, including Arabic-Indic digits', () => {
    expect(matches(one('amount', 'eq', 123), { amount: '١٢٣' })).toBe(true);
    expect(matches(one('amount', 'eq', 123), { amount: '۱۲۳' })).toBe(true);
    expect(matches(one('amount', 'eq', 1234.5), { amount: '١٬٢٣٤٫٥' })).toBe(true);
    expect(matches(one('amount', 'gt', 100), { amount: '1,234' })).toBe(true);
    expect(matches(one('amount', 'between', { from: 1, to: 5 }), { amount: ' ٣ ' })).toBe(true);
  });

  it('works with negatives and zero', () => {
    expect(matches(one('amount', 'lt', 0), { amount: -1 })).toBe(true);
    expect(matches(one('amount', 'eq', 0), { amount: 0 })).toBe(true);
    expect(matches(one('amount', 'eq', 0), { amount: '' })).toBe(false);
  });

  it('only a missing or non-numeric value matches not-equal', () => {
    for (const amount of [null, undefined, 'abc', '', Number.NaN]) {
      expect(matches(one('amount', 'neq', 5), { amount })).toBe(true);
      expect(matches(one('amount', 'eq', 5), { amount })).toBe(false);
      expect(matches(one('amount', 'gt', 5), { amount })).toBe(false);
      expect(matches(one('amount', 'between', { from: 1, to: 9 }), { amount })).toBe(false);
    }
  });
});

describe('evaluate dates', () => {
  it('on, before and after compare calendar days', () => {
    const row = { created: '2024-03-10' };
    expect(matches(one('created', 'on', '2024-03-10'), row)).toBe(true);
    expect(matches(one('created', 'on', '2024-03-11'), row)).toBe(false);
    expect(matches(one('created', 'before', '2024-03-11'), row)).toBe(true);
    expect(matches(one('created', 'before', '2024-03-10'), row)).toBe(false);
    expect(matches(one('created', 'after', '2024-03-09'), row)).toBe(true);
    expect(matches(one('created', 'after', '2024-03-10'), row)).toBe(false);
  });

  it('between is inclusive at both ends', () => {
    const group = one('created', 'between', { from: '2024-03-01', to: '2024-03-31' });
    expect(matches(group, { created: '2024-03-01' })).toBe(true);
    expect(matches(group, { created: '2024-03-31' })).toBe(true);
    expect(matches(group, { created: '2024-02-29' })).toBe(false);
    expect(matches(group, { created: '2024-04-01' })).toBe(false);
  });

  it('reads the date part of a date-time string as written, with no time zone shift', () => {
    expect(
      matches(one('created', 'on', '2024-03-10'), { created: '2024-03-10T23:30:00-05:00' }),
    ).toBe(true);
    expect(matches(one('created', 'on', '2024-03-10'), { created: '2024-03-10T00:00:00Z' })).toBe(
      true,
    );
  });

  it('reads a Date in local time', () => {
    expect(
      matches(one('created', 'on', '2024-03-10'), { created: new Date(2024, 2, 10, 23, 59) }),
    ).toBe(true);
    expect(
      matches(one('created', 'on', '2024-03-10'), { created: new Date(2024, 2, 10, 0, 0) }),
    ).toBe(true);
  });

  it('reads dates written with Arabic-Indic digits', () => {
    expect(matches(one('created', 'on', '2024-03-10'), { created: '٢٠٢٤-٠٣-١٠' })).toBe(true);
  });

  it('never matches a missing or invalid date', () => {
    for (const created of [null, undefined, '', 'soon', '2024-02-31', new Date(Number.NaN)]) {
      expect(matches(one('created', 'on', '2024-03-10'), { created })).toBe(false);
      expect(matches(one('created', 'before', '2099-01-01'), { created })).toBe(false);
      expect(matches(one('created', 'in_last', 30), { created })).toBe(false);
    }
  });

  it('in the last N days runs from N days ago up to today, inclusive', () => {
    const group = one('created', 'in_last', 7);
    expect(matches(group, { created: '2024-03-15' })).toBe(true);
    expect(matches(group, { created: '2024-03-08' })).toBe(true);
    expect(matches(group, { created: '2024-03-07' })).toBe(false);
    expect(matches(group, { created: '2024-03-16' })).toBe(false);
  });

  it('in the last 0 days is today only', () => {
    const group = one('created', 'in_last', 0);
    expect(matches(group, { created: '2024-03-15' })).toBe(true);
    expect(matches(group, { created: '2024-03-14' })).toBe(false);
  });

  it('counts calendar days across month, leap-day and DST boundaries', () => {
    expect(matches(one('created', 'in_last', 1), { created: '2024-02-29' }, '2024-03-01')).toBe(
      true,
    );
    expect(matches(one('created', 'in_last', 1), { created: '2024-02-28' }, '2024-03-01')).toBe(
      false,
    );
    expect(matches(one('created', 'in_last', 1), { created: '2024-03-09' }, '2024-03-10')).toBe(
      true,
    );
    expect(matches(one('created', 'in_last', 1), { created: '2024-10-26' }, '2024-10-27')).toBe(
      true,
    );
    expect(matches(one('created', 'in_last', 1), { created: '2023-12-31' }, '2024-01-01')).toBe(
      true,
    );
  });

  it('uses the local date for today by default', () => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(evaluate(one('created', 'in_last', 0), { created: today }, accessors)).toBe(true);
  });
});

describe('evaluate select and boolean', () => {
  it('is, is not and is any of', () => {
    expect(matches(one('status', 'is', 'new'), { status: 'new' })).toBe(true);
    expect(matches(one('status', 'is', 'new'), { status: 'done' })).toBe(false);
    expect(matches(one('status', 'is_not', 'new'), { status: 'done' })).toBe(true);
    expect(matches(one('status', 'is_not', 'new'), { status: 'new' })).toBe(false);
    expect(matches(one('status', 'is_any_of', ['new', 'open']), { status: 'open' })).toBe(true);
    expect(matches(one('status', 'is_any_of', ['new', 'open']), { status: 'done' })).toBe(false);
  });

  it('compares option values exactly', () => {
    expect(matches(one('status', 'is', 'new'), { status: 'New' })).toBe(false);
  });

  it('is not matches a missing value; the positive operators do not', () => {
    expect(matches(one('status', 'is_not', 'new'), { status: null })).toBe(true);
    expect(matches(one('status', 'is', 'new'), { status: null })).toBe(false);
    expect(matches(one('status', 'is_any_of', ['new']), {})).toBe(false);
  });

  it('handles a list-valued field (tags)', () => {
    expect(matches(one('status', 'is', 'b'), { status: ['a', 'b'] })).toBe(true);
    expect(matches(one('status', 'is_not', 'b'), { status: ['a', 'b'] })).toBe(false);
    expect(matches(one('status', 'is_any_of', ['x', 'a']), { status: ['a', 'b'] })).toBe(true);
  });

  it('is true and is false', () => {
    expect(matches(one('active', 'is_true', null), { active: true })).toBe(true);
    expect(matches(one('active', 'is_true', null), { active: false })).toBe(false);
    expect(matches(one('active', 'is_false', null), { active: false })).toBe(true);
    expect(matches(one('active', 'is_false', null), { active: true })).toBe(false);
  });

  it('reads "true"/"false" strings and treats a missing value as false', () => {
    expect(matches(one('active', 'is_true', null), { active: 'TRUE' })).toBe(true);
    expect(matches(one('active', 'is_true', null), { active: 'false' })).toBe(false);
    expect(matches(one('active', 'is_false', null), { active: null })).toBe(true);
    expect(matches(one('active', 'is_true', null), {})).toBe(false);
  });
});

describe('evaluate groups', () => {
  const alice: Row = { name: 'Alice', amount: 50, status: 'new' };

  it('and needs every rule, or needs one', () => {
    const rules = [
      { id: 'a', field: 'name', operator: 'contains', value: 'ali' },
      { id: 'b', field: 'amount', operator: 'gt', value: 100 },
    ] as const;
    expect(matches(createGroup('and', rules), alice)).toBe(false);
    expect(matches(createGroup('or', rules), alice)).toBe(true);
  });

  it('nests groups to any depth', () => {
    const group = createGroup('and', [
      { id: 'a', field: 'name', operator: 'contains', value: 'ali' },
      createGroup('or', [
        { id: 'b', field: 'amount', operator: 'gt', value: 100 },
        createGroup('and', [
          { id: 'c', field: 'status', operator: 'is', value: 'new' },
          { id: 'd', field: 'amount', operator: 'lt', value: 60 },
        ]),
      ]),
    ]);
    expect(matches(group, alice)).toBe(true);
    expect(matches(group, { ...alice, status: 'done' })).toBe(false);
    expect(matches(group, { ...alice, amount: 500 })).toBe(true);
  });

  it('an empty filter matches every row', () => {
    expect(matches(createGroup(), alice)).toBe(true);
    expect(matches(createGroup('or', []), {})).toBe(true);
  });

  it('skips unfinished rules instead of hiding every row', () => {
    const group = createGroup('and', [
      { id: 'a', field: 'name', operator: 'contains', value: '' },
      { id: 'b', field: 'amount', operator: 'between', value: { from: 1, to: null } },
      { id: 'c', field: 'status', operator: 'is', value: 'new' },
    ]);
    expect(matches(group, alice)).toBe(true);
    expect(matches(group, { ...alice, status: 'done' })).toBe(false);
  });

  it('a group of only unfinished rules does not affect its parent', () => {
    const group = createGroup('or', [
      { id: 'a', field: 'status', operator: 'is', value: 'done' },
      createGroup('and', [{ id: 'b', field: 'name', operator: 'contains', value: '' }]),
    ]);
    expect(matches(group, alice)).toBe(false);
    expect(matches(group, { status: 'done' })).toBe(true);
  });

  it('skips rules whose field has no accessor', () => {
    const group = createGroup('and', [
      { id: 'a', field: 'ghost', operator: 'contains', value: 'x' },
      { id: 'b', field: 'status', operator: 'is', value: 'new' },
    ]);
    expect(matches(group, alice)).toBe(true);
  });
});

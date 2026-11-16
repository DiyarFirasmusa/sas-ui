import { describe, expect, it } from 'vitest';
import {
  createGroup,
  type FilterField,
  type FilterGroup,
  type FilterNode,
  type FilterRule,
} from '@/lib/filter-builder';
import { FILTER_PARAM, fromSearchParams, toSearchParams } from '@/lib/filter-builder-url';
import { validateGroup } from '@/lib/filter-builder-validate';

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
      { value: 'open', label: 'Open' },
      { value: 'a,b', label: 'Comma' },
      { value: 'x|y', label: 'Pipe' },
    ],
  },
  { id: 'active', label: 'Active', type: 'boolean' },
];

function rule(
  id: string,
  field: string,
  operator: FilterRule['operator'],
  value: FilterRule['value'],
): FilterRule {
  return { id, field, operator, value };
}

/** Rule ids are not stored in the URL, so compare structure only. */
function withoutIds(node: FilterNode): unknown {
  return 'combinator' in node
    ? { combinator: node.combinator, rules: node.rules.map(withoutIds) }
    : { field: node.field, operator: node.operator, value: node.value };
}

function roundTrip(group: FilterGroup): FilterGroup {
  return fromSearchParams(toSearchParams(group), fields);
}

const full = createGroup('and', [
  rule('1', 'name', 'contains', 'ali'),
  rule('2', 'amount', 'between', { from: 10, to: 20.5 }),
  rule('3', 'created', 'between', { from: '2024-01-01', to: '2024-01-31' }),
  rule('4', 'created', 'in_last', 30),
  createGroup('or', [
    rule('5', 'status', 'is_any_of', ['new', 'open']),
    rule('6', 'active', 'is_true', null),
    createGroup('and', [rule('7', 'name', 'is_empty', null), rule('8', 'amount', 'neq', -3)]),
  ]),
]);

describe('toSearchParams', () => {
  it('writes one compact, versioned parameter', () => {
    const params = toSearchParams(
      createGroup('and', [
        rule('1', 'name', 'contains', 'ali'),
        createGroup('or', [rule('2', 'amount', 'gt', 5), rule('3', 'active', 'is_true', null)]),
      ]),
    );
    expect([...params.keys()]).toEqual([FILTER_PARAM]);
    expect(params.get(FILTER_PARAM)).toBe('v1~a(name:contains:ali,o(amount:gt:5,active:is_true:))');
  });

  it('survives a trip through the query string', () => {
    const query = toSearchParams(full).toString();
    expect(query).toMatch(/^fb=v1%7E/);
    expect(query).not.toMatch(/[\s"<>]/);
    expect(withoutIds(fromSearchParams(query, fields))).toEqual(withoutIds(full));
    expect(withoutIds(fromSearchParams(`?${query}`, fields))).toEqual(withoutIds(full));
  });

  it('uses a custom parameter name', () => {
    const params = toSearchParams(full, { key: 'filter' });
    expect(params.has('fb')).toBe(false);
    expect(withoutIds(fromSearchParams(params, fields, { key: 'filter' }))).toEqual(
      withoutIds(full),
    );
    expect(fromSearchParams(params, fields).rules).toEqual([]);
  });

  it('leaves out unfinished rules and empty groups', () => {
    const params = toSearchParams(
      createGroup('and', [
        rule('1', 'name', 'contains', ''),
        rule('2', 'amount', 'gt', null),
        createGroup('or', [rule('3', 'created', 'between', { from: '2024-01-01', to: null })]),
        rule('4', 'name', 'contains', 'kept'),
      ]),
    );
    expect(params.get(FILTER_PARAM)).toBe('v1~a(name:contains:kept)');
  });

  it('writes nothing when nothing is complete', () => {
    expect(toSearchParams(createGroup()).toString()).toBe('');
    expect(toSearchParams(createGroup('and', [rule('1', 'name', 'contains', '')])).toString()).toBe(
      '',
    );
  });
});

describe('round trip', () => {
  it('restores a full tree, combinators and nesting included', () => {
    expect(withoutIds(roundTrip(full))).toEqual(withoutIds(full));
  });

  it('keeps an or root and a single rule', () => {
    const group = createGroup('or', [rule('1', 'amount', 'lte', 0)]);
    expect(withoutIds(roundTrip(group))).toEqual(withoutIds(group));
  });

  it('restores Arabic text and Arabic-Indic digits exactly as typed', () => {
    const group = createGroup('and', [
      rule('1', 'name', 'contains', 'مُحَمَّد أحمد'),
      rule('2', 'name', 'equals', 'فاتورة ١٢٣'),
    ]);
    const restored = roundTrip(group);
    expect(withoutIds(restored)).toEqual(withoutIds(group));
    expect(toSearchParams(group).toString()).not.toMatch(/[؀-ۿ]/);
  });

  it('escapes the separator characters inside values', () => {
    const awkward = 'a,b(c):d|e\\f)';
    const group = createGroup('and', [
      rule('1', 'name', 'contains', awkward),
      rule('2', 'status', 'is_any_of', ['a,b', 'x|y']),
      rule('3', 'status', 'is', 'a,b'),
    ]);
    expect(withoutIds(roundTrip(group))).toEqual(withoutIds(group));
  });

  it('keeps emoji, quotes, ampersands and plus signs', () => {
    const group = createGroup('and', [rule('1', 'name', 'contains', `"R&D" + 100% ✓ 🙂 =x`)]);
    expect(withoutIds(roundTrip(group))).toEqual(withoutIds(group));
  });

  it('keeps decimals, negatives and exponent-sized numbers', () => {
    const group = createGroup('and', [
      rule('1', 'amount', 'eq', -0.125),
      rule('2', 'amount', 'between', { from: -5, to: 1e21 }),
    ]);
    expect(withoutIds(roundTrip(group))).toEqual(withoutIds(group));
  });

  it('generates ids in document order and the result validates', () => {
    const restored = roundTrip(full);
    const ids: string[] = [];
    const walk = (node: FilterNode) => {
      if ('combinator' in node) {
        node.rules.forEach(walk);
      } else {
        ids.push(node.id);
      }
    };
    walk(restored);
    expect(ids).toEqual(['url-1', 'url-2', 'url-3', 'url-4', 'url-5', 'url-6', 'url-7', 'url-8']);
    expect(validateGroup(restored, fields)).toEqual({});
  });
});

describe('fromSearchParams', () => {
  const read = (value: string) => fromSearchParams(new URLSearchParams({ fb: value }), fields);

  it('returns an empty group when the parameter is absent', () => {
    expect(fromSearchParams('', fields)).toEqual(createGroup());
    expect(fromSearchParams('q=x', fields)).toEqual(createGroup());
  });

  it('ignores another version or no version', () => {
    expect(read('v2~a(name:contains:x)')).toEqual(createGroup());
    expect(read('a(name:contains:x)')).toEqual(createGroup());
    expect(read('')).toEqual(createGroup());
  });

  it('returns an empty group for malformed input and never throws', () => {
    for (const bad of [
      'v1~',
      'v1~x(name:contains:x)',
      'v1~a(',
      'v1~a(name:contains:x',
      'v1~a(name:contains)',
      'v1~a(name)',
      'v1~a(,)',
      'v1~a(name:contains:x))',
      'v1~a(name:contains:x)trailing',
      'v1~a(name:contains:x,',
      'v1~a(a(',
      'v1~a(name:contains:\\',
      'v1~a()(',
    ]) {
      expect(() => read(bad)).not.toThrow();
      expect(read(bad), bad).toEqual(createGroup());
    }
  });

  it('accepts an empty group', () => {
    expect(read('v1~a()')).toEqual(createGroup('and', []));
    expect(read('v1~o()')).toEqual(createGroup('or', []));
  });

  it('drops rules with an unknown field or an operator the field does not allow', () => {
    const group = read(
      'v1~a(ghost:contains:x,amount:contains:x,name:gt:3,name:contains:ok,name:bogus:x)',
    );
    expect(withoutIds(group)).toEqual(
      withoutIds(createGroup('and', [rule('x', 'name', 'contains', 'ok')])),
    );
  });

  it('drops rules with a malformed value', () => {
    const group = read(
      'v1~a(amount:gt:abc,amount:gt:,amount:between:1,amount:between:1|2|3,amount:between:9|1,' +
        'created:on:2024-02-31,created:on:tomorrow,created:in_last:1.5,created:in_last:-2,' +
        'created:between:2024-02-01|2024-01-01,name:contains:,name:contains:keep)',
    );
    expect(withoutIds(group)).toEqual(
      withoutIds(createGroup('and', [rule('x', 'name', 'contains', 'keep')])),
    );
  });

  it('drops options the field does not offer', () => {
    const group = read('v1~a(status:is:archived,status:is_any_of:new|archived,status:is:open)');
    expect(withoutIds(group)).toEqual(
      withoutIds(createGroup('and', [rule('x', 'status', 'is', 'open')])),
    );
  });

  it('drops groups left empty, and keeps the root', () => {
    expect(read('v1~a(o(ghost:is:x),name:contains:ok)').rules).toHaveLength(1);
    expect(read('v1~o(ghost:contains:x)')).toEqual(createGroup('or', []));
  });

  it('ignores boolean values and treats an operator without a value as complete', () => {
    expect(withoutIds(read('v1~a(active:is_false:junk,name:is_empty:)'))).toEqual(
      withoutIds(
        createGroup('and', [
          rule('x', 'active', 'is_false', null),
          rule('y', 'name', 'is_empty', null),
        ]),
      ),
    );
  });

  it('refuses over-deep and over-long input', () => {
    const deep = `v1~${'a('.repeat(20)}${')'.repeat(20)}`;
    expect(read(deep)).toEqual(createGroup());
    const shallow = `v1~${'a('.repeat(5)}name:contains:x${')'.repeat(5)}`;
    expect(read(shallow).rules).toHaveLength(1);
    const long = `v1~a(name:contains:${'x'.repeat(9000)})`;
    expect(read(long)).toEqual(createGroup());
  });

  it('reads an operator a field supports even when another type shares the name', () => {
    const group = read('v1~a(amount:between:1|2,created:between:2024-01-01|2024-01-02)');
    expect(group.rules).toHaveLength(2);
  });
});

import { describe, expect, it } from 'vitest';
import {
  FIELD_OPERATORS,
  addNode,
  changeRuleField,
  changeRuleOperator,
  convertValue,
  countRules,
  createGroup,
  createRule,
  defaultValue,
  newRuleId,
  operatorsFor,
  removeNode,
  setCombinator,
  updateRule,
  valueKind,
  type FilterField,
  type FilterGroup,
  type FilterOperator,
  type FilterRule,
} from '@/lib/filter-builder';

const fields: FilterField[] = [
  { id: 'name', label: 'Name', type: 'text' },
  { id: 'title', label: 'Title', type: 'text' },
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

function field(id: string): FilterField {
  const found = fields.find((candidate) => candidate.id === id);
  if (found === undefined) {
    throw new Error(`no field ${id}`);
  }
  return found;
}

function rule(
  id: string,
  fieldId: string,
  operator: FilterOperator,
  value: FilterRule['value'],
): FilterRule {
  return { id, field: fieldId, operator, value };
}

describe('operators', () => {
  it('offers the documented operators per field type', () => {
    expect(operatorsFor('text')).toEqual([
      'contains',
      'not_contains',
      'equals',
      'starts_with',
      'is_empty',
    ]);
    expect(operatorsFor('number')).toEqual(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between']);
    expect(operatorsFor('date')).toEqual(['on', 'before', 'after', 'between', 'in_last']);
    expect(operatorsFor('select')).toEqual(['is', 'is_not', 'is_any_of']);
    expect(operatorsFor('boolean')).toEqual(['is_true', 'is_false']);
  });

  it('knows which editor every operator needs', () => {
    const kinds = Object.values(FIELD_OPERATORS)
      .flat()
      .map((operator) => valueKind(operator));
    expect(new Set(kinds)).toEqual(
      new Set(['none', 'text', 'number', 'date', 'days', 'range', 'option', 'options']),
    );
    expect(valueKind('is_empty')).toBe('none');
    expect(valueKind('is_true')).toBe('none');
    expect(valueKind('in_last')).toBe('days');
    expect(valueKind('between')).toBe('range');
  });
});

describe('createRule', () => {
  it('starts on the first operator of the field type with an empty value', () => {
    expect(createRule(field('name'), { id: 'a' })).toEqual({
      id: 'a',
      field: 'name',
      operator: 'contains',
      value: '',
    });
    expect(createRule(field('amount'), { id: 'a' }).value).toBeNull();
    expect(createRule(field('active'), { id: 'a' }).operator).toBe('is_true');
  });

  it('accepts an operator and value, and builds the matching empty value', () => {
    expect(createRule(field('amount'), { id: 'a', operator: 'between' }).value).toEqual({
      from: null,
      to: null,
    });
    expect(createRule(field('status'), { id: 'a', operator: 'is_any_of' }).value).toEqual([]);
    expect(createRule(field('amount'), { id: 'a', operator: 'gt', value: 5 }).value).toBe(5);
  });

  it('generates unique ids by default', () => {
    expect(createRule(field('name')).id).not.toBe(createRule(field('name')).id);
    expect(newRuleId()).toMatch(/^rule-/);
  });

  it('defaultValue matches the operator', () => {
    expect(defaultValue('contains')).toBe('');
    expect(defaultValue('gt')).toBeNull();
    expect(defaultValue('is_any_of')).toEqual([]);
    expect(defaultValue('is_empty')).toBeNull();
  });
});

describe('changing a rule', () => {
  it('keeps the value between operators of the same kind', () => {
    const next = changeRuleOperator(rule('a', 'amount', 'gt', 5), 'gte');
    expect(next).toEqual(rule('a', 'amount', 'gte', 5));
  });

  it('resets an incompatible value', () => {
    expect(changeRuleOperator(rule('a', 'amount', 'gt', 5), 'between').value).toEqual({
      from: null,
      to: null,
    });
    expect(changeRuleOperator(rule('a', 'name', 'contains', 'x'), 'is_empty').value).toBeNull();
    expect(
      changeRuleOperator(rule('a', 'created', 'on', '2024-01-01'), 'in_last').value,
    ).toBeNull();
  });

  it('turns one option into a list and back', () => {
    expect(convertValue('is', 'is_any_of', 'new')).toEqual(['new']);
    expect(convertValue('is', 'is_any_of', null)).toEqual([]);
    expect(convertValue('is_any_of', 'is', ['done', 'new'])).toBe('done');
    expect(convertValue('is_any_of', 'is', [])).toBeNull();
  });

  it('keeps operator and value between two fields of the same free-form type', () => {
    const next = changeRuleField(
      rule('a', 'name', 'starts_with', 'ali'),
      field('title'),
      field('name'),
    );
    expect(next).toEqual(rule('a', 'title', 'starts_with', 'ali'));
  });

  it('starts again when the type changes, keeping the id', () => {
    const next = changeRuleField(
      rule('a', 'name', 'contains', 'ali'),
      field('amount'),
      field('name'),
    );
    expect(next).toEqual(rule('a', 'amount', 'eq', null));
  });

  it('starts again between select fields, whose options differ', () => {
    const next = changeRuleField(rule('a', 'status', 'is', 'new'), field('free'), field('status'));
    expect(next).toEqual(rule('a', 'free', 'is', null));
  });

  it('returns the same rule when the field does not change', () => {
    const original = rule('a', 'name', 'contains', 'x');
    expect(changeRuleField(original, field('name'), field('name'))).toBe(original);
  });

  it('starts again when the previous field is unknown', () => {
    expect(changeRuleField(rule('a', 'gone', 'contains', 'x'), field('name'), undefined)).toEqual(
      rule('a', 'name', 'contains', ''),
    );
  });
});

describe('editing the tree', () => {
  const tree: FilterGroup = createGroup('and', [
    rule('r1', 'name', 'contains', 'a'),
    createGroup('or', [rule('r2', 'name', 'contains', 'b'), createGroup('and', [])]),
  ]);

  it('adds a node to the root or to a nested group without mutating', () => {
    const added = addNode(tree, [], rule('r3', 'name', 'contains', 'c'));
    expect(added.rules).toHaveLength(3);
    expect(tree.rules).toHaveLength(2);
    const nested = addNode(tree, [1], rule('r3', 'name', 'contains', 'c'));
    expect(countRules(nested)).toBe(3);
    const deep = addNode(tree, [1, 1], rule('r4', 'name', 'contains', 'd'));
    expect(countRules(deep)).toBe(3);
  });

  it('ignores a path that does not lead to a group', () => {
    expect(addNode(tree, [0], rule('r3', 'name', 'contains', 'c'))).toBe(tree);
    expect(addNode(tree, [9], rule('r3', 'name', 'contains', 'c'))).toBe(tree);
  });

  it('removes a rule or a whole group by path', () => {
    expect(removeNode(tree, [0]).rules).toHaveLength(1);
    expect(countRules(removeNode(tree, [1]))).toBe(1);
    expect(countRules(removeNode(tree, [1, 0]))).toBe(1);
    expect(removeNode(tree, [])).toBe(tree);
  });

  it('sets the combinator of any group', () => {
    expect(setCombinator(tree, [], 'or').combinator).toBe('or');
    const nested = setCombinator(tree, [1], 'and').rules[1];
    expect(nested && 'combinator' in nested && nested.combinator).toBe('and');
  });

  it('updates a rule by id wherever it is', () => {
    const next = updateRule(tree, 'r2', (current) => ({ ...current, value: 'z' }));
    const group = next.rules[1];
    expect(group && 'rules' in group && group.rules[0]).toEqual(
      rule('r2', 'name', 'contains', 'z'),
    );
    expect(updateRule(tree, 'missing', (current) => current).rules[0]).toBe(tree.rules[0]);
  });

  it('counts rules, not groups', () => {
    expect(countRules(createGroup())).toBe(0);
    expect(countRules(tree)).toBe(2);
    expect(countRules(createGroup('and', [createGroup('or', [createGroup('and', [])])]))).toBe(0);
  });
});

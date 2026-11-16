/* ---------------------------------- model --------------------------------- */

export type FilterFieldType = 'text' | 'number' | 'date' | 'select' | 'boolean';

export interface FilterFieldOption {
  value: string;
  label: string;
}

export interface FilterField {
  id: string;
  label: string;
  type: FilterFieldType;
  /** Choices of a `select` field. */
  options?: readonly FilterFieldOption[];
}

export type FilterOperator =
  | 'contains'
  | 'not_contains'
  | 'equals'
  | 'starts_with'
  | 'is_empty'
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'on'
  | 'before'
  | 'after'
  | 'in_last'
  | 'is'
  | 'is_not'
  | 'is_any_of'
  | 'is_true'
  | 'is_false';

export type FilterCombinator = 'and' | 'or';

/** Inclusive numeric range; either end is `null` while the user is still typing. */
export interface NumberRange {
  from: number | null;
  to: number | null;
}

/** Inclusive range of ISO `yyyy-mm-dd` dates. */
export interface DateRange {
  from: string | null;
  to: string | null;
}

/**
 * What a rule compares against, by operator: text → string, numbers and
 * "in the last N days" → number, dates → ISO `yyyy-mm-dd` string, `between` →
 * a range, `is`/`is not` → an option value, `is any of` → option values,
 * `is empty` and the boolean operators → `null`.
 */
export type FilterValue = string | number | null | readonly string[] | NumberRange | DateRange;

export interface FilterRule {
  id: string;
  /** `FilterField.id` */
  field: string;
  operator: FilterOperator;
  value: FilterValue;
}

export interface FilterGroup {
  combinator: FilterCombinator;
  rules: readonly (FilterRule | FilterGroup)[];
}

export type FilterNode = FilterRule | FilterGroup;

/** Child indexes from the root group to a nested group (`[]` is the root). */
export type GroupPath = readonly number[];

export function isFilterGroup(node: FilterNode): node is FilterGroup {
  return 'combinator' in node;
}

/* -------------------------------- operators ------------------------------- */

export const FIELD_OPERATORS: Readonly<Record<FilterFieldType, readonly FilterOperator[]>> = {
  text: ['contains', 'not_contains', 'equals', 'starts_with', 'is_empty'],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between'],
  date: ['on', 'before', 'after', 'between', 'in_last'],
  select: ['is', 'is_not', 'is_any_of'],
  boolean: ['is_true', 'is_false'],
};

export function operatorsFor(type: FilterFieldType): readonly FilterOperator[] {
  return FIELD_OPERATORS[type];
}

/** The editor an operator needs. `range` is numeric or date depending on the field. */
export type ValueKind =
  | 'none'
  | 'text'
  | 'number'
  | 'date'
  | 'days'
  | 'range'
  | 'option'
  | 'options';

export function valueKind(operator: FilterOperator): ValueKind {
  switch (operator) {
    case 'is_empty':
    case 'is_true':
    case 'is_false':
      return 'none';
    case 'contains':
    case 'not_contains':
    case 'equals':
    case 'starts_with':
      return 'text';
    case 'eq':
    case 'neq':
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte':
      return 'number';
    case 'on':
    case 'before':
    case 'after':
      return 'date';
    case 'in_last':
      return 'days';
    case 'between':
      return 'range';
    case 'is':
    case 'is_not':
      return 'option';
    case 'is_any_of':
      return 'options';
  }
}

/* ------------------------------ value guards ------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isNumberRange(value: unknown): value is NumberRange {
  return (
    isRecord(value) &&
    (value.from === null || typeof value.from === 'number') &&
    (value.to === null || typeof value.to === 'number')
  );
}

export function isDateRange(value: unknown): value is DateRange {
  return (
    isRecord(value) &&
    (value.from === null || typeof value.from === 'string') &&
    (value.to === null || typeof value.to === 'string')
  );
}

export function isStringList(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/* --------------------------- creating and editing -------------------------- */

let idCounter = 0;

/** A unique rule id. Not stable across sessions; pass `id` to `createRule` when you need one. */
export function newRuleId(): string {
  idCounter += 1;
  return `rule-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

/** The empty value for an operator: what the editor starts with. */
export function defaultValue(operator: FilterOperator): FilterValue {
  switch (valueKind(operator)) {
    case 'text':
      return '';
    case 'range':
      return { from: null, to: null };
    case 'options':
      return [];
    default:
      return null;
  }
}

/**
 * Keeps the value when the new operator takes the same kind of value (`>` to
 * `≥`), turns one option into a list and back (`is` to `is any of`), and
 * resets it otherwise, so a number is never left under a date operator.
 */
export function convertValue(
  from: FilterOperator,
  to: FilterOperator,
  value: FilterValue,
): FilterValue {
  const before = valueKind(from);
  const after = valueKind(to);
  if (before === after) {
    return value;
  }
  if (before === 'option' && after === 'options') {
    return typeof value === 'string' && value !== '' ? [value] : [];
  }
  if (before === 'options' && after === 'option') {
    return isStringList(value) ? (value[0] ?? null) : null;
  }
  return defaultValue(to);
}

export function createRule(
  field: FilterField,
  init: { id?: string; operator?: FilterOperator; value?: FilterValue } = {},
): FilterRule {
  const operator = init.operator ?? operatorsFor(field.type)[0] ?? 'contains';
  return {
    id: init.id ?? newRuleId(),
    field: field.id,
    operator,
    value: init.value ?? defaultValue(operator),
  };
}

/**
 * Points a rule at another field. Between two fields of the same free-form
 * type the operator and value carry over; otherwise (different type, or
 * different options) the rule starts again so no stale value survives.
 */
export function changeRuleField(
  rule: FilterRule,
  next: FilterField,
  previous: FilterField | undefined,
): FilterRule {
  if (rule.field === next.id) {
    return rule;
  }
  const carriesOver =
    previous !== undefined &&
    previous.type === next.type &&
    (next.type === 'text' || next.type === 'number' || next.type === 'date');
  return carriesOver ? { ...rule, field: next.id } : createRule(next, { id: rule.id });
}

export function changeRuleOperator(rule: FilterRule, operator: FilterOperator): FilterRule {
  return {
    ...rule,
    operator,
    value: convertValue(rule.operator, operator, rule.value),
  };
}

export function createGroup(
  combinator: FilterCombinator = 'and',
  rules: readonly FilterNode[] = [],
): FilterGroup {
  return { combinator, rules };
}

function updateGroupAt(
  group: FilterGroup,
  path: GroupPath,
  update: (target: FilterGroup) => FilterGroup,
): FilterGroup {
  const [head, ...rest] = path;
  if (head === undefined) {
    return update(group);
  }
  const child = group.rules[head];
  if (child === undefined || !isFilterGroup(child)) {
    return group;
  }
  return {
    ...group,
    rules: group.rules.map((node, index) =>
      index === head ? updateGroupAt(child, rest, update) : node,
    ),
  };
}

export function addNode(group: FilterGroup, path: GroupPath, node: FilterNode): FilterGroup {
  return updateGroupAt(group, path, (target) => ({ ...target, rules: [...target.rules, node] }));
}

/** Removes the node at `path` (the last index is the node, the rest is its parent group). */
export function removeNode(group: FilterGroup, path: GroupPath): FilterGroup {
  const index = path[path.length - 1];
  if (index === undefined) {
    return group;
  }
  return updateGroupAt(group, path.slice(0, -1), (target) => ({
    ...target,
    rules: target.rules.filter((_, position) => position !== index),
  }));
}

export function setCombinator(
  group: FilterGroup,
  path: GroupPath,
  combinator: FilterCombinator,
): FilterGroup {
  return updateGroupAt(group, path, (target) => ({ ...target, combinator }));
}

/** Replaces the rule with this id, wherever it sits in the tree. */
export function updateRule(
  group: FilterGroup,
  ruleId: string,
  update: (rule: FilterRule) => FilterRule,
): FilterGroup {
  return {
    ...group,
    rules: group.rules.map((node) => {
      if (isFilterGroup(node)) {
        return updateRule(node, ruleId, update);
      }
      return node.id === ruleId ? update(node) : node;
    }),
  };
}

/** How many rules (not groups) the tree holds. */
export function countRules(group: FilterGroup): number {
  return group.rules.reduce(
    (total, node) => total + (isFilterGroup(node) ? countRules(node) : 1),
    0,
  );
}

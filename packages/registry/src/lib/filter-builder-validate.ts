import { parseISODate } from '@/lib/date-utils';
import {
  isFilterGroup,
  isStringList,
  operatorsFor,
  valueKind,
  type FilterField,
  type FilterFieldType,
  type FilterGroup,
  type FilterOperator,
  type FilterRule,
  type FilterValue,
} from '@/lib/filter-builder';

export type FilterRuleError =
  | 'unknown_field'
  | 'invalid_operator'
  | 'required'
  | 'invalid_number'
  | 'invalid_date'
  | 'invalid_range'
  | 'invalid_days'
  | 'invalid_option';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function checkRange(value: FilterValue, type: FilterFieldType | undefined): FilterRuleError | null {
  if (!isRecord(value)) {
    return 'required';
  }
  const { from, to } = value;
  if (from === null || to === null || from === undefined || to === undefined) {
    return 'required';
  }
  const numeric = type === 'number' || (type === undefined && typeof from === 'number');
  if (numeric) {
    if (!isFiniteNumber(from) || !isFiniteNumber(to)) {
      return 'invalid_number';
    }
    return from <= to ? null : 'invalid_range';
  }
  if (typeof from !== 'string' || typeof to !== 'string') {
    return 'invalid_date';
  }
  if (parseISODate(from) === null || parseISODate(to) === null) {
    return 'invalid_date';
  }
  return from <= to ? null : 'invalid_range';
}

/**
 * Structural check of a value against its operator, with no field in hand
 * (the shape of the value, not whether an option exists). `type` only
 * disambiguates `between`, which is numeric for numbers and a date range for dates.
 */
export function checkValue(
  operator: FilterOperator,
  value: FilterValue,
  type?: FilterFieldType,
): FilterRuleError | null {
  switch (valueKind(operator)) {
    case 'none':
      return null;
    case 'text':
      return typeof value === 'string' && value.trim() !== '' ? null : 'required';
    case 'number':
      if (value === null) {
        return 'required';
      }
      return isFiniteNumber(value) ? null : 'invalid_number';
    case 'days':
      if (value === null) {
        return 'required';
      }
      return isFiniteNumber(value) && Number.isInteger(value) && value >= 0 ? null : 'invalid_days';
    case 'date':
      if (value === null || value === '') {
        return 'required';
      }
      return typeof value === 'string' && parseISODate(value) !== null ? null : 'invalid_date';
    case 'range':
      return checkRange(value, type);
    case 'option':
      if (value === null || value === '') {
        return 'required';
      }
      return typeof value === 'string' ? null : 'invalid_option';
    case 'options':
      if (!isStringList(value)) {
        return value === null ? 'required' : 'invalid_option';
      }
      return value.length > 0 ? null : 'required';
  }
}

/** First problem with one rule, or `null` when it is complete and consistent with its field. */
export function validateRule(
  rule: FilterRule,
  fields: readonly FilterField[],
): FilterRuleError | null {
  const field = fields.find((candidate) => candidate.id === rule.field);
  if (field === undefined) {
    return 'unknown_field';
  }
  if (!operatorsFor(field.type).includes(rule.operator)) {
    return 'invalid_operator';
  }
  const problem = checkValue(rule.operator, rule.value, field.type);
  if (problem !== null || field.type !== 'select' || field.options === undefined) {
    return problem;
  }
  const known = new Set(field.options.map((option) => option.value));
  const chosen: readonly unknown[] = isStringList(rule.value) ? rule.value : [rule.value];
  return chosen.every((item) => typeof item === 'string' && known.has(item))
    ? null
    : 'invalid_option';
}

/** Problems keyed by rule id; a rule without an entry is valid. Groups with no rules are fine. */
export function validateGroup(
  group: FilterGroup,
  fields: readonly FilterField[],
): Record<string, FilterRuleError> {
  const errors: Record<string, FilterRuleError> = {};
  const visit = (current: FilterGroup) => {
    for (const node of current.rules) {
      if (isFilterGroup(node)) {
        visit(node);
        continue;
      }
      const problem = validateRule(node, fields);
      if (problem !== null) {
        errors[node.id] = problem;
      }
    }
  };
  visit(group);
  return errors;
}

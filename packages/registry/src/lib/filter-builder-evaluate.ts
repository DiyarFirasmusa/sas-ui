import { matchesText, normalizeArabic, toLatinDigits } from '@/lib/arabic-normalize';
import type { NormalizeArabicOptions } from '@/lib/arabic-normalize';
import { addDays, parseISODate, toISODate } from '@/lib/date-utils';
import {
  isDateRange,
  isFilterGroup,
  isNumberRange,
  isStringList,
  type FilterGroup,
  type FilterNode,
  type FilterRule,
} from '@/lib/filter-builder';
import { checkValue } from '@/lib/filter-builder-validate';

/** How to read a field off a row; the key is `FilterField.id`. */
export type FieldAccessors<Row> = Readonly<Record<string, (row: Row) => unknown>>;

export interface EvaluateOptions {
  /** Folding options for text rules; see `normalizeArabic`. */
  normalize?: NormalizeArabicOptions;
  /** "Today" as `yyyy-mm-dd` for "in the last N days". Defaults to the local date. */
  today?: string;
}

function toText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return isStringList(value) ? value.join(' ') : '';
}

/** Numbers pass through; strings are read with Latin digits (`١٢٣` → 123) and `,` as a thousands mark. */
function toNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const text = toLatinDigits(value).replace(/,/g, '').trim();
  const parsed = text === '' ? Number.NaN : Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

/** A `Date` is read in local time; a string by its leading `yyyy-mm-dd`, so no time zone can shift the day. */
function toDay(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : toISODate(value);
  }
  if (typeof value !== 'string') {
    return null;
  }
  const day = toLatinDigits(value.trim()).slice(0, 10);
  return parseISODate(day) === null ? null : day;
}

function toOptionList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => (item === null || item === undefined ? [] : [String(item)]));
  }
  return value === null || value === undefined ? [] : [String(value)];
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.trim().toLowerCase() === 'true';
  }
  return value === 1;
}

function compareNumber(rule: FilterRule, actual: number | null): boolean {
  const { operator, value } = rule;
  if (operator === 'between') {
    return (
      isNumberRange(value) &&
      actual !== null &&
      value.from !== null &&
      value.to !== null &&
      actual >= value.from &&
      actual <= value.to
    );
  }
  if (typeof value !== 'number') {
    return false;
  }
  if (actual === null) {
    return operator === 'neq';
  }
  switch (operator) {
    case 'eq':
      return actual === value;
    case 'neq':
      return actual !== value;
    case 'gt':
      return actual > value;
    case 'gte':
      return actual >= value;
    case 'lt':
      return actual < value;
    case 'lte':
      return actual <= value;
    default:
      return false;
  }
}

function compareDay(rule: FilterRule, actual: string | null, today: string): boolean {
  const { operator, value } = rule;
  if (actual === null) {
    return false;
  }
  if (operator === 'between') {
    return isDateRange(value) && value.from !== null && value.to !== null
      ? actual >= value.from && actual <= value.to
      : false;
  }
  if (operator === 'in_last') {
    const start = parseISODate(today);
    if (typeof value !== 'number' || start === null) {
      return false;
    }
    return actual >= toISODate(addDays(start, -value)) && actual <= today;
  }
  if (typeof value !== 'string') {
    return false;
  }
  switch (operator) {
    case 'on':
      return actual === value;
    case 'before':
      return actual < value;
    case 'after':
      return actual > value;
    default:
      return false;
  }
}

function compareText(rule: FilterRule, actual: unknown, options: NormalizeArabicOptions): boolean {
  const text = toText(actual);
  const needle = typeof rule.value === 'string' ? rule.value : '';
  switch (rule.operator) {
    case 'contains':
      return matchesText(text, needle, 'contains', options);
    case 'not_contains':
      return !matchesText(text, needle, 'contains', options);
    case 'equals':
      return matchesText(text, needle, 'equals', options);
    case 'starts_with':
      return matchesText(text, needle, 'startsWith', options);
    case 'is_empty':
      return normalizeArabic(text, options) === '';
    default:
      return false;
  }
}

function compareOption(rule: FilterRule, actual: unknown): boolean {
  const list = toOptionList(actual);
  const { value } = rule;
  switch (rule.operator) {
    case 'is':
      return typeof value === 'string' && list.includes(value);
    case 'is_not':
      return typeof value === 'string' && !list.includes(value);
    case 'is_any_of':
      return isStringList(value) && value.some((item) => list.includes(item));
    default:
      return false;
  }
}

/** `null` means the rule is skipped: unfinished, or the row has no accessor for its field. */
function evaluateRule<Row>(
  rule: FilterRule,
  row: Row,
  accessors: FieldAccessors<Row>,
  options: EvaluateOptions,
  today: string,
): boolean | null {
  const accessor = accessors[rule.field];
  if (accessor === undefined || checkValue(rule.operator, rule.value) !== null) {
    return null;
  }
  const actual = accessor(row);
  switch (rule.operator) {
    case 'contains':
    case 'not_contains':
    case 'equals':
    case 'starts_with':
    case 'is_empty':
      return compareText(rule, actual, options.normalize ?? {});
    case 'eq':
    case 'neq':
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte':
      return compareNumber(rule, toNumber(actual));
    case 'on':
    case 'before':
    case 'after':
    case 'in_last':
      return compareDay(rule, toDay(actual), today);
    case 'between':
      // The same operator serves numbers and dates; the value says which.
      return isNumberRange(rule.value) && typeof rule.value.from === 'number'
        ? compareNumber(rule, toNumber(actual))
        : compareDay(rule, toDay(actual), today);
    case 'is':
    case 'is_not':
    case 'is_any_of':
      return compareOption(rule, actual);
    case 'is_true':
      return toBoolean(actual);
    case 'is_false':
      return !toBoolean(actual);
  }
}

function evaluateNode<Row>(
  node: FilterNode,
  row: Row,
  accessors: FieldAccessors<Row>,
  options: EvaluateOptions,
  today: string,
): boolean | null {
  if (!isFilterGroup(node)) {
    return evaluateRule(node, row, accessors, options, today);
  }
  const results = node.rules
    .map((child) => evaluateNode(child, row, accessors, options, today))
    .filter((result): result is boolean => result !== null);
  if (results.length === 0) {
    return null;
  }
  return node.combinator === 'and' ? results.every(Boolean) : results.some(Boolean);
}

/**
 * Whether `row` satisfies the filter, for client-side lists. Text rules go
 * through `normalizeArabic`, so Arabic search ignores diacritics, alef forms
 * and digit styles; `"١٢٣"` also finds `123`.
 *
 * - Unfinished rules (no value yet) and rules whose field has no accessor are
 *   skipped, as are groups left empty by that; an empty filter matches every row.
 * - Negative operators (`not contains`, `≠`, `is not`) match missing values.
 * - `is false` matches a missing value; `is true` needs a real `true`.
 * - "In the last N days" runs from N days before today up to today, inclusive.
 */
export function evaluate<Row>(
  group: FilterGroup,
  row: Row,
  accessors: FieldAccessors<Row>,
  options: EvaluateOptions = {},
): boolean {
  const today = options.today ?? toISODate(new Date());
  return evaluateNode(group, row, accessors, options, today) ?? true;
}

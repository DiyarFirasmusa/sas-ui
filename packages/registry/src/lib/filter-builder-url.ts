import {
  createGroup,
  isDateRange,
  isFilterGroup,
  isNumberRange,
  isStringList,
  operatorsFor,
  valueKind,
  type FilterField,
  type FilterGroup,
  type FilterNode,
  type FilterOperator,
  type FilterRule,
  type FilterValue,
} from '@/lib/filter-builder';
import { checkValue, validateRule } from '@/lib/filter-builder-validate';

/**
 * One query parameter carries the whole filter, in a compact versioned text:
 *
 * ```
 * fb=v1~a(name:contains:ali,amount:between:10|20,o(status:is_any_of:new|open,done:is_true:))
 * ```
 *
 * `a(…)` / `o(…)` are and/or groups, a rule is `field:operator:value`, and
 * `,` `(` `)` `:` `|` `\` inside a value are backslash-escaped. `|` separates
 * the two ends of a range and the items of a list. Rule ids are not stored:
 * reading generates `url-1`, `url-2`, … in document order.
 */
const VERSION = 'v1';
export const FILTER_PARAM = 'fb';
const MAX_LENGTH = 8000;
const MAX_DEPTH = 8;

export interface FilterSearchParamsOptions {
  /** Query parameter name. Default `fb`. */
  key?: string;
}

/* -------------------------------- writing --------------------------------- */

function escape(text: string): string {
  return text.replace(/[\\,():|]/g, (char) => `\\${char}`);
}

function writeValue(rule: FilterRule): string {
  const { value } = rule;
  switch (valueKind(rule.operator)) {
    case 'none':
      return '';
    case 'range':
      return isNumberRange(value) || isDateRange(value) ? `${value.from}|${value.to}` : '';
    case 'options':
      return isStringList(value) ? value.map(escape).join('|') : '';
    default:
      return typeof value === 'string' ? escape(value) : String(value);
  }
}

function writeNode(node: FilterNode): string | null {
  if (isFilterGroup(node)) {
    const children = node.rules.flatMap((child) => writeNode(child) ?? []);
    return children.length === 0
      ? null
      : `${node.combinator === 'and' ? 'a' : 'o'}(${children.join(',')})`;
  }
  if (checkValue(node.operator, node.value) !== null) {
    return null;
  }
  return `${escape(node.field)}:${node.operator}:${writeValue(node)}`;
}

/**
 * The filter as one query parameter. Unfinished rules and empty groups are
 * left out, so what a shared link restores is exactly what a user could apply;
 * a filter with nothing complete yields no parameter at all.
 */
export function toSearchParams(
  group: FilterGroup,
  { key = FILTER_PARAM }: FilterSearchParamsOptions = {},
): URLSearchParams {
  const params = new URLSearchParams();
  const body = writeNode(group);
  if (body !== null) {
    params.set(key, `${VERSION}~${body}`);
  }
  return params;
}

/* -------------------------------- reading --------------------------------- */

class FilterSyntaxError extends Error {}

interface Cursor {
  text: string;
  position: number;
}

/** Reads up to (not including) an unescaped stop character; escapes stay in the result. */
function readRaw(cursor: Cursor, stops: string): string {
  let raw = '';
  while (cursor.position < cursor.text.length) {
    const char = cursor.text.charAt(cursor.position);
    if (char === '\\') {
      raw += cursor.text.slice(cursor.position, cursor.position + 2);
      cursor.position += 2;
      continue;
    }
    if (stops.includes(char)) {
      break;
    }
    raw += char;
    cursor.position += 1;
  }
  return raw;
}

function expect(cursor: Cursor, char: string): void {
  if (cursor.text.charAt(cursor.position) !== char) {
    throw new FilterSyntaxError(`Expected "${char}" at ${cursor.position}`);
  }
  cursor.position += 1;
}

function unescape(raw: string): string {
  return raw.replace(/\\([\s\S])/g, '$1');
}

function splitEscaped(raw: string, separator: string): string[] {
  const parts: string[] = [];
  let current = '';
  for (let index = 0; index < raw.length; index += 1) {
    const char = raw.charAt(index);
    if (char === '\\') {
      current += raw.slice(index, index + 2);
      index += 1;
    } else if (char === separator) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

function readNumber(text: string): number | null {
  const value = text.trim() === '' ? Number.NaN : Number(text);
  return Number.isFinite(value) ? value : null;
}

function readValue(
  operator: FilterOperator,
  field: FilterField,
  raw: string,
): FilterValue | undefined {
  switch (valueKind(operator)) {
    case 'none':
      return null;
    case 'text':
    case 'option':
      return unescape(raw);
    case 'number':
    case 'days':
      return readNumber(raw) ?? undefined;
    case 'date':
      return raw;
    case 'options':
      return splitEscaped(raw, '|').map(unescape);
    case 'range': {
      const [from, to, ...extra] = splitEscaped(raw, '|');
      if (from === undefined || to === undefined || extra.length > 0) {
        return undefined;
      }
      if (field.type === 'number') {
        const low = readNumber(from);
        const high = readNumber(to);
        return low === null || high === null ? undefined : { from: low, to: high };
      }
      return { from, to };
    }
  }
}

function readRule(
  cursor: Cursor,
  fields: readonly FilterField[],
  nextId: () => string,
): FilterRule | null {
  const fieldId = unescape(readRaw(cursor, ':'));
  expect(cursor, ':');
  const operatorText = readRaw(cursor, ':');
  expect(cursor, ':');
  const raw = readRaw(cursor, ',)');
  const field = fields.find((candidate) => candidate.id === fieldId);
  const operator =
    field && operatorsFor(field.type).find((candidate) => candidate === operatorText);
  if (field === undefined || operator === undefined) {
    return null;
  }
  const value = readValue(operator, field, raw);
  if (value === undefined) {
    return null;
  }
  const rule: FilterRule = { id: nextId(), field: field.id, operator, value };
  return validateRule(rule, fields) === null ? rule : null;
}

function readGroup(
  cursor: Cursor,
  fields: readonly FilterField[],
  nextId: () => string,
  depth: number,
): FilterGroup {
  if (depth > MAX_DEPTH) {
    throw new FilterSyntaxError('Groups are nested too deeply');
  }
  const letter = cursor.text.charAt(cursor.position);
  if (letter !== 'a' && letter !== 'o') {
    throw new FilterSyntaxError(`Expected a group at ${cursor.position}`);
  }
  cursor.position += 1;
  expect(cursor, '(');
  const rules: FilterNode[] = [];
  while (cursor.text.charAt(cursor.position) !== ')') {
    const startsGroup =
      'ao'.includes(cursor.text.charAt(cursor.position)) &&
      cursor.text.charAt(cursor.position + 1) === '(';
    const node = startsGroup
      ? readGroup(cursor, fields, nextId, depth + 1)
      : readRule(cursor, fields, nextId);
    if (node !== null && !(isFilterGroup(node) && node.rules.length === 0)) {
      rules.push(node);
    }
    if (cursor.text.charAt(cursor.position) === ',') {
      cursor.position += 1;
    } else if (cursor.text.charAt(cursor.position) !== ')') {
      throw new FilterSyntaxError(`Unexpected end at ${cursor.position}`);
    }
  }
  cursor.position += 1;
  return createGroup(letter === 'a' ? 'and' : 'or', rules);
}

/**
 * Reads the filter back. It never throws and never returns an impossible
 * state: a missing, hand-edited, over-long or newer-version parameter gives an
 * empty group, and a rule that names an unknown field, an operator the field
 * does not allow, an option it does not offer or a malformed value is dropped
 * on its own. Validate `fields` against the same list the editor uses.
 */
export function fromSearchParams(
  source: URLSearchParams | string,
  fields: readonly FilterField[],
  { key = FILTER_PARAM }: FilterSearchParamsOptions = {},
): FilterGroup {
  const params = typeof source === 'string' ? new URLSearchParams(source) : source;
  const text = params.get(key);
  const prefix = `${VERSION}~`;
  if (text === null || text.length > MAX_LENGTH || !text.startsWith(prefix)) {
    return createGroup();
  }
  let counter = 0;
  const nextId = () => {
    counter += 1;
    return `url-${counter}`;
  };
  try {
    const cursor: Cursor = { text, position: prefix.length };
    const group = readGroup(cursor, fields, nextId, 0);
    return cursor.position === text.length ? group : createGroup();
  } catch (error) {
    if (error instanceof FilterSyntaxError) {
      return createGroup();
    }
    throw error;
  }
}

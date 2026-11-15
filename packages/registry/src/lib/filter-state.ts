import { fillTemplate } from '@/lib/format-message';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterBase {
  /** Query-string key and the key in the `value` record. */
  key: string;
  label: string;
  /** Section heading in the filters panel. Filters without one share the first section. */
  group?: string;
}

export type FilterDefinition =
  | (FilterBase & { type: 'text'; placeholder?: string })
  | (FilterBase & { type: 'select'; options: readonly FilterOption[] })
  | (FilterBase & { type: 'multi-select'; options: readonly FilterOption[] })
  | (FilterBase & { type: 'boolean' })
  | (FilterBase & { type: 'number-range'; min?: number; max?: number })
  | (FilterBase & { type: 'date' })
  | (FilterBase & { type: 'date-range' });

export type FilterValues = Record<string, unknown>;
export interface NumberRangeValue {
  min?: number;
  max?: number;
}
export interface DateRangeValue {
  from?: string;
  to?: string;
}

export interface FilterStateOptions {
  /** Key of the free-text search in the value record. It is not a filter and is never counted. Default `q`. */
  searchKey?: string;
}

const DEFAULT_SEARCH_KEY = 'q';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A real calendar date in `YYYY-MM-DD` form (rejects 2024-02-31). */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNumberRange(value: unknown): value is NumberRangeValue {
  return (
    isRecord(value) &&
    (value.min === undefined || typeof value.min === 'number') &&
    (value.max === undefined || typeof value.max === 'number')
  );
}

function isDateRange(value: unknown): value is DateRangeValue {
  return (
    isRecord(value) &&
    (value.from === undefined || typeof value.from === 'string') &&
    (value.to === undefined || typeof value.to === 'string')
  );
}

/**
 * The clean form of a raw value for a filter, or `undefined` when the filter
 * is not set (empty text, empty list, a range with neither end, a bad date…).
 * Everything else in this file builds on it, so "active" means one thing.
 */
export function sanitizeFilterValue(definition: FilterDefinition, raw: unknown): unknown {
  switch (definition.type) {
    case 'text': {
      return typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : undefined;
    }
    case 'select': {
      return typeof raw === 'string' && raw !== '' ? raw : undefined;
    }
    case 'multi-select': {
      if (!Array.isArray(raw)) {
        return undefined;
      }
      const values = [
        ...new Set(raw.filter((item): item is string => typeof item === 'string' && item !== '')),
      ];
      return values.length > 0 ? values : undefined;
    }
    case 'boolean': {
      return typeof raw === 'boolean' ? raw : undefined;
    }
    case 'number-range': {
      if (!isRecord(raw)) {
        return undefined;
      }
      const min = toNumber(raw.min);
      const max = toNumber(raw.max);
      if (min === undefined && max === undefined) {
        return undefined;
      }
      const range: NumberRangeValue = {};
      if (min !== undefined) {
        range.min = min;
      }
      if (max !== undefined) {
        range.max = max;
      }
      return range;
    }
    case 'date': {
      return isIsoDate(raw) ? raw : undefined;
    }
    case 'date-range': {
      if (!isRecord(raw)) {
        return undefined;
      }
      const range: DateRangeValue = {};
      if (isIsoDate(raw.from)) {
        range.from = raw.from;
      }
      if (isIsoDate(raw.to)) {
        range.to = raw.to;
      }
      return range.from === undefined && range.to === undefined ? undefined : range;
    }
  }
}

export function isFilterActive(definition: FilterDefinition, raw: unknown): boolean {
  return sanitizeFilterValue(definition, raw) !== undefined;
}

/** How many filters are set. The search text is not a filter. */
export function countActiveFilters(
  definitions: readonly FilterDefinition[],
  values: FilterValues,
): number {
  return definitions.filter((definition) => isFilterActive(definition, values[definition.key]))
    .length;
}

/**
 * Sets the filters of `draft` on top of `values`: each defined filter is
 * replaced by its clean value or removed when empty. Keys that are not
 * filters (search, sort, page) are kept as they are.
 */
export function applyFilterValues(
  definitions: readonly FilterDefinition[],
  values: FilterValues,
  draft: FilterValues,
): FilterValues {
  const next: FilterValues = { ...values };
  for (const definition of definitions) {
    const clean = sanitizeFilterValue(definition, draft[definition.key]);
    if (clean === undefined) {
      delete next[definition.key];
    } else {
      next[definition.key] = clean;
    }
  }
  return next;
}

/** Removes every filter but keeps the search text and any other keys. */
export function clearFilters(
  definitions: readonly FilterDefinition[],
  values: FilterValues,
): FilterValues {
  return applyFilterValues(definitions, values, {});
}

/** Removes one filter by key. */
export function removeFilter(values: FilterValues, key: string): FilterValues {
  const { [key]: _removed, ...rest } = values;
  return rest;
}

/** Sets (or, for an empty string, removes) the search text. */
export function setSearch(
  values: FilterValues,
  text: string,
  { searchKey = DEFAULT_SEARCH_KEY }: FilterStateOptions = {},
): FilterValues {
  return text.trim() === '' ? removeFilter(values, searchKey) : { ...values, [searchKey]: text };
}

export function getSearch(
  values: FilterValues,
  { searchKey = DEFAULT_SEARCH_KEY }: FilterStateOptions = {},
): string {
  const text = values[searchKey];
  return typeof text === 'string' ? text : '';
}

/* ------------------------------- grouping --------------------------------- */

export interface FilterGroup {
  /** `undefined` for filters without a group. */
  group: string | undefined;
  filters: FilterDefinition[];
}

/** Filters grouped by their `group`, in the order each group first appears. */
export function groupFilters(definitions: readonly FilterDefinition[]): FilterGroup[] {
  const groups: FilterGroup[] = [];
  for (const definition of definitions) {
    const existing = groups.find((candidate) => candidate.group === definition.group);
    if (existing) {
      existing.filters.push(definition);
    } else {
      groups.push({ group: definition.group, filters: [definition] });
    }
  }
  return groups;
}

/* --------------------------------- chips ---------------------------------- */

/** Templates for the chip text; the component supplies them from its labels. */
export interface ChipTexts {
  yes: string;
  no: string;
  /** `{value}` */
  from: string;
  /** `{value}` */
  upTo: string;
  /** `{from}`, `{to}` */
  between: string;
}

export interface FilterChip {
  id: string;
  key: string;
  /** Set for one option of a multi-select; removing the chip removes only that option. */
  optionValue?: string;
  label: string;
  text: string;
}

function rangeText(texts: ChipTexts, from: string | undefined, to: string | undefined): string {
  if (from !== undefined && to !== undefined) {
    return fillTemplate(texts.between, { from, to });
  }
  return from !== undefined
    ? fillTemplate(texts.from, { value: from })
    : fillTemplate(texts.upTo, { value: to ?? '' });
}

/** One chip per active filter value (one per chosen option for multi-selects). */
export function getFilterChips(
  definitions: readonly FilterDefinition[],
  values: FilterValues,
  texts: ChipTexts,
): FilterChip[] {
  const chips: FilterChip[] = [];
  for (const definition of definitions) {
    const clean = sanitizeFilterValue(definition, values[definition.key]);
    if (clean === undefined) {
      continue;
    }
    const base = { key: definition.key, label: definition.label };
    switch (definition.type) {
      case 'text':
      case 'date':
        chips.push({ ...base, id: definition.key, text: String(clean) });
        break;
      case 'select': {
        const option = definition.options.find((candidate) => candidate.value === clean);
        chips.push({
          ...base,
          id: definition.key,
          text: option?.label ?? String(clean),
        });
        break;
      }
      case 'multi-select': {
        for (const item of isStringArray(clean) ? clean : []) {
          const option = definition.options.find((candidate) => candidate.value === item);
          chips.push({
            ...base,
            id: `${definition.key}:${item}`,
            optionValue: item,
            text: option?.label ?? item,
          });
        }
        break;
      }
      case 'boolean':
        chips.push({
          ...base,
          id: definition.key,
          text: clean ? texts.yes : texts.no,
        });
        break;
      case 'number-range': {
        const range = isNumberRange(clean) ? clean : {};
        chips.push({
          ...base,
          id: definition.key,
          text: rangeText(
            texts,
            range.min === undefined ? undefined : String(range.min),
            range.max === undefined ? undefined : String(range.max),
          ),
        });
        break;
      }
      case 'date-range': {
        const range = isDateRange(clean) ? clean : {};
        chips.push({
          ...base,
          id: definition.key,
          text: rangeText(texts, range.from, range.to),
        });
        break;
      }
    }
  }
  return chips;
}

/** Removes the value a chip stands for: one multi-select option, or the whole filter. */
export function removeChip(values: FilterValues, chip: FilterChip): FilterValues {
  if (chip.optionValue === undefined) {
    return removeFilter(values, chip.key);
  }
  const current = values[chip.key];
  const rest = Array.isArray(current) ? current.filter((item) => item !== chip.optionValue) : [];
  return rest.length > 0 ? { ...values, [chip.key]: rest } : removeFilter(values, chip.key);
}

/* ------------------------------ URL round trip ----------------------------- */

/**
 * Query keys per filter type. Ranges use two keys (`price_min`, `price_max`,
 * `created_from`, `created_to`) because that is what list endpoints expect;
 * multi-selects repeat the key (`status=a&status=b`).
 */
export function serializeFilters(
  definitions: readonly FilterDefinition[],
  values: FilterValues,
  { searchKey = DEFAULT_SEARCH_KEY }: FilterStateOptions = {},
): URLSearchParams {
  const params = new URLSearchParams();
  const search = values[searchKey];
  if (typeof search === 'string' && search.trim() !== '') {
    params.set(searchKey, search.trim());
  }
  for (const definition of definitions) {
    const clean = sanitizeFilterValue(definition, values[definition.key]);
    if (clean === undefined) {
      continue;
    }
    const { key } = definition;
    if (isStringArray(clean)) {
      clean.forEach((item) => params.append(key, item));
    } else if (definition.type === 'number-range' && isNumberRange(clean)) {
      if (clean.min !== undefined) {
        params.set(`${key}_min`, String(clean.min));
      }
      if (clean.max !== undefined) {
        params.set(`${key}_max`, String(clean.max));
      }
    } else if (definition.type === 'date-range' && isDateRange(clean)) {
      if (clean.from !== undefined) {
        params.set(`${key}_from`, clean.from);
      }
      if (clean.to !== undefined) {
        params.set(`${key}_to`, clean.to);
      }
    } else {
      params.set(key, String(clean));
    }
  }
  return params;
}

/**
 * Reads filters back from a URL. Unknown parameters are ignored and invalid
 * values (a bad date, a non-number, a boolean that is not true/false) are
 * dropped, so a hand-edited URL can never put the UI in an impossible state.
 */
export function parseFilters(
  definitions: readonly FilterDefinition[],
  source: URLSearchParams | string,
  { searchKey = DEFAULT_SEARCH_KEY }: FilterStateOptions = {},
): FilterValues {
  const params = typeof source === 'string' ? new URLSearchParams(source) : source;
  const values: FilterValues = {};
  const search = params.get(searchKey);
  if (search !== null && search.trim() !== '') {
    values[searchKey] = search.trim();
  }
  for (const definition of definitions) {
    let raw: unknown;
    switch (definition.type) {
      case 'multi-select':
        raw = params.getAll(definition.key);
        break;
      case 'boolean': {
        const text = params.get(definition.key);
        raw = text === 'true' ? true : text === 'false' ? false : undefined;
        break;
      }
      case 'number-range':
        raw = {
          min: params.get(`${definition.key}_min`),
          max: params.get(`${definition.key}_max`),
        };
        break;
      case 'date-range':
        raw = {
          from: params.get(`${definition.key}_from`),
          to: params.get(`${definition.key}_to`),
        };
        break;
      default:
        raw = params.get(definition.key) ?? undefined;
    }
    const clean = sanitizeFilterValue(definition, raw);
    if (clean !== undefined) {
      values[definition.key] = clean;
    }
  }
  return values;
}

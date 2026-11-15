import { describe, expect, it } from 'vitest';
import {
  applyFilterValues,
  clearFilters,
  countActiveFilters,
  getFilterChips,
  getSearch,
  groupFilters,
  isFilterActive,
  isIsoDate,
  parseFilters,
  removeChip,
  removeFilter,
  sanitizeFilterValue,
  serializeFilters,
  setSearch,
  type ChipTexts,
  type FilterDefinition,
} from '@/lib/filter-state';

const definitions: FilterDefinition[] = [
  { key: 'name', type: 'text', label: 'Name', group: 'General' },
  {
    key: 'status',
    type: 'select',
    label: 'Status',
    group: 'General',
    options: [
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
    ],
  },
  {
    key: 'tags',
    type: 'multi-select',
    label: 'Tags',
    group: 'Details',
    options: [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ],
  },
  { key: 'paid', type: 'boolean', label: 'Paid', group: 'Details' },
  { key: 'price', type: 'number-range', label: 'Price', group: 'Details' },
  { key: 'due', type: 'date', label: 'Due' },
  { key: 'created', type: 'date-range', label: 'Created' },
];

const texts: ChipTexts = {
  yes: 'Yes',
  no: 'No',
  from: 'From {value}',
  upTo: 'Up to {value}',
  between: '{from} – {to}',
};

function definition(key: string): FilterDefinition {
  const found = definitions.find((candidate) => candidate.key === key);
  if (!found) {
    throw new Error(`no definition ${key}`);
  }
  return found;
}

describe('isIsoDate', () => {
  it('accepts real calendar dates only', () => {
    expect(isIsoDate('2024-02-29')).toBe(true);
    expect(isIsoDate('2023-02-29')).toBe(false);
    expect(isIsoDate('2024-13-01')).toBe(false);
    expect(isIsoDate('2024-1-1')).toBe(false);
    expect(isIsoDate('٢٠٢٤-٠١-٠١')).toBe(false);
    expect(isIsoDate(20240101)).toBe(false);
    expect(isIsoDate('')).toBe(false);
  });
});

describe('sanitizeFilterValue', () => {
  it('trims text and drops blanks', () => {
    expect(sanitizeFilterValue(definition('name'), '  Ali ')).toBe('Ali');
    expect(sanitizeFilterValue(definition('name'), '   ')).toBeUndefined();
    expect(sanitizeFilterValue(definition('name'), 5)).toBeUndefined();
  });

  it('keeps select values and drops the empty "any" choice', () => {
    expect(sanitizeFilterValue(definition('status'), 'open')).toBe('open');
    expect(sanitizeFilterValue(definition('status'), '')).toBeUndefined();
    expect(sanitizeFilterValue(definition('status'), null)).toBeUndefined();
  });

  it('dedupes multi-selects and drops non-strings', () => {
    expect(sanitizeFilterValue(definition('tags'), ['a', 'b', 'a', '', 3])).toEqual(['a', 'b']);
    expect(sanitizeFilterValue(definition('tags'), [])).toBeUndefined();
    expect(sanitizeFilterValue(definition('tags'), 'a')).toBeUndefined();
  });

  it('treats false as an active boolean', () => {
    expect(sanitizeFilterValue(definition('paid'), false)).toBe(false);
    expect(sanitizeFilterValue(definition('paid'), true)).toBe(true);
    expect(sanitizeFilterValue(definition('paid'), 'true')).toBeUndefined();
  });

  it('accepts numeric strings in ranges and keeps zero', () => {
    expect(sanitizeFilterValue(definition('price'), { min: '10', max: 20 })).toEqual({ min: 10, max: 20 });
    expect(sanitizeFilterValue(definition('price'), { min: 0 })).toEqual({ min: 0 });
    expect(sanitizeFilterValue(definition('price'), { min: '', max: 'abc' })).toBeUndefined();
    expect(sanitizeFilterValue(definition('price'), { min: Number.NaN })).toBeUndefined();
    expect(sanitizeFilterValue(definition('price'), 5)).toBeUndefined();
  });

  it('validates dates and date ranges', () => {
    expect(sanitizeFilterValue(definition('due'), '2024-05-01')).toBe('2024-05-01');
    expect(sanitizeFilterValue(definition('due'), '2024-02-31')).toBeUndefined();
    expect(sanitizeFilterValue(definition('created'), { from: '2024-01-01', to: 'nope' })).toEqual({ from: '2024-01-01' });
    expect(sanitizeFilterValue(definition('created'), { from: '', to: '' })).toBeUndefined();
  });
});

describe('isFilterActive / countActiveFilters', () => {
  it('counts only set filters and never the search text', () => {
    const values = { q: 'hotel', name: 'Ali', status: '', tags: ['a', 'b'], paid: false, price: {}, extra: 1 };
    expect(isFilterActive(definition('tags'), values.tags)).toBe(true);
    expect(countActiveFilters(definitions, values)).toBe(3);
  });

  it('is zero for no values', () => {
    expect(countActiveFilters(definitions, {})).toBe(0);
    expect(countActiveFilters([], { name: 'x' })).toBe(0);
  });
});

describe('applyFilterValues / clearFilters / removeFilter', () => {
  it('replaces filters with clean values, removes empty ones and keeps other keys', () => {
    const next = applyFilterValues(
      definitions,
      { q: 'x', page: 3, status: 'open', name: 'old' },
      { name: ' new ', status: '', tags: ['a'] },
    );
    expect(next).toEqual({ q: 'x', page: 3, name: 'new', tags: ['a'] });
  });

  it('clears every filter but keeps search and unrelated keys', () => {
    expect(clearFilters(definitions, { q: 'x', page: 2, name: 'Ali', paid: true })).toEqual({ q: 'x', page: 2 });
  });

  it('removes one key without touching the input', () => {
    const values = { name: 'Ali', status: 'open' };
    expect(removeFilter(values, 'name')).toEqual({ status: 'open' });
    expect(values).toEqual({ name: 'Ali', status: 'open' });
    expect(removeFilter(values, 'missing')).toEqual(values);
  });
});

describe('search helpers', () => {
  it('sets, reads and clears the search text', () => {
    const withSearch = setSearch({ name: 'Ali' }, 'hotel');
    expect(withSearch).toEqual({ name: 'Ali', q: 'hotel' });
    expect(getSearch(withSearch)).toBe('hotel');
    expect(setSearch(withSearch, '   ')).toEqual({ name: 'Ali' });
    expect(getSearch({})).toBe('');
  });

  it('honours a custom key', () => {
    expect(setSearch({}, 'x', { searchKey: 'search' })).toEqual({ search: 'x' });
    expect(getSearch({ search: 'x' }, { searchKey: 'search' })).toBe('x');
  });
});

describe('groupFilters', () => {
  it('groups in first-seen order and keeps ungrouped filters together', () => {
    const groups = groupFilters(definitions);
    expect(groups.map((entry) => entry.group)).toEqual(['General', 'Details', undefined]);
    expect(groups[1]?.filters.map((entry) => entry.key)).toEqual(['tags', 'paid', 'price']);
    expect(groups[2]?.filters.map((entry) => entry.key)).toEqual(['due', 'created']);
  });

  it('handles no filters', () => {
    expect(groupFilters([])).toEqual([]);
  });
});

describe('getFilterChips / removeChip', () => {
  const values = {
    name: 'Ali',
    status: 'closed',
    tags: ['a', 'b'],
    paid: false,
    price: { min: 10 },
    due: '2024-05-01',
    created: { from: '2024-01-01', to: '2024-02-01' },
  };

  it('builds one chip per value with readable text', () => {
    const chips = getFilterChips(definitions, values, texts);
    expect(chips.map((chip) => `${chip.label}: ${chip.text}`)).toEqual([
      'Name: Ali',
      'Status: Closed',
      'Tags: Alpha',
      'Tags: Beta',
      'Paid: No',
      'Price: From 10',
      'Due: 2024-05-01',
      'Created: 2024-01-01 – 2024-02-01',
    ]);
    expect(new Set(chips.map((chip) => chip.id)).size).toBe(chips.length);
  });

  it('shows an upper bound and falls back to the raw value for unknown options', () => {
    const chips = getFilterChips(definitions, { price: { max: 5 }, status: 'archived' }, texts);
    expect(chips.map((chip) => chip.text)).toEqual(['archived', 'Up to 5']);
  });

  it('skips inactive filters', () => {
    expect(getFilterChips(definitions, { name: '', tags: [] }, texts)).toEqual([]);
  });

  it('removes one multi-select option, then the whole filter when none is left', () => {
    const chips = getFilterChips(definitions, { tags: ['a', 'b'] }, texts);
    const afterFirst = removeChip({ tags: ['a', 'b'], q: 'x' }, chips[0]!);
    expect(afterFirst).toEqual({ tags: ['b'], q: 'x' });
    const afterSecond = removeChip(afterFirst, chips[1]!);
    expect(afterSecond).toEqual({ q: 'x' });
  });

  it('removes a whole single-value filter', () => {
    const chip = getFilterChips(definitions, { name: 'Ali', status: 'open' }, texts)[0]!;
    expect(removeChip({ name: 'Ali', status: 'open' }, chip)).toEqual({ status: 'open' });
  });
});

describe('serializeFilters', () => {
  it('writes every filter type', () => {
    const params = serializeFilters(definitions, {
      q: ' hotel ',
      name: 'Ali',
      status: 'open',
      tags: ['a', 'b'],
      paid: false,
      price: { min: 10, max: 20 },
      due: '2024-05-01',
      created: { from: '2024-01-01' },
    });
    expect(params.toString()).toBe(
      'q=hotel&name=Ali&status=open&tags=a&tags=b&paid=false&price_min=10&price_max=20&due=2024-05-01&created_from=2024-01-01',
    );
  });

  it('omits empty and invalid values', () => {
    expect(serializeFilters(definitions, { q: '  ', name: '', tags: [], price: { min: 'x' }, due: 'bad' }).toString()).toBe('');
  });

  it('escapes special characters and keeps Arabic text', () => {
    const params = serializeFilters(definitions, { name: 'أحمد & سارة=1' });
    expect(params.get('name')).toBe('أحمد & سارة=1');
    expect(params.toString()).not.toContain('&سارة');
  });

  it('writes zero and negative numbers', () => {
    expect(serializeFilters(definitions, { price: { min: 0, max: -1 } }).toString()).toBe('price_min=0&price_max=-1');
  });

  it('uses a custom search key', () => {
    expect(serializeFilters(definitions, { search: 'x' }, { searchKey: 'search' }).toString()).toBe('search=x');
  });
});

describe('parseFilters', () => {
  it('reads from a string or URLSearchParams', () => {
    const query = 'q=hotel&status=open&tags=a&tags=b&paid=true&price_max=9.5&created_to=2024-02-01';
    const expected = {
      q: 'hotel',
      status: 'open',
      tags: ['a', 'b'],
      paid: true,
      price: { max: 9.5 },
      created: { to: '2024-02-01' },
    };
    expect(parseFilters(definitions, query)).toEqual(expected);
    expect(parseFilters(definitions, new URLSearchParams(query))).toEqual(expected);
    expect(parseFilters(definitions, `?${query}`)).toEqual(expected);
  });

  it('ignores unknown parameters and drops invalid values', () => {
    const parsed = parseFilters(definitions, 'page=2&paid=maybe&due=2024-02-31&price_min=abc&name=%20&tags=');
    expect(parsed).toEqual({});
  });

  it('parses booleans false and true', () => {
    expect(parseFilters(definitions, 'paid=false')).toEqual({ paid: false });
  });

  it('decodes Arabic text', () => {
    expect(parseFilters(definitions, `name=${encodeURIComponent('مكتب')}`)).toEqual({ name: 'مكتب' });
  });

  it('returns nothing for an empty query', () => {
    expect(parseFilters(definitions, '')).toEqual({});
  });
});

describe('URL round trip', () => {
  const cases: Record<string, Record<string, unknown>> = {
    empty: {},
    'search only': { q: 'hotel' },
    everything: {
      q: 'عمان',
      name: 'Ali',
      status: 'closed',
      tags: ['a', 'b'],
      paid: false,
      price: { min: 0, max: 99.5 },
      due: '2024-12-31',
      created: { from: '2024-01-01', to: '2024-01-31' },
    },
    'half ranges': { price: { max: 3 }, created: { from: '2024-06-01' } },
  };

  it.each(Object.entries(cases))('survives serialise then parse: %s', (_name, values) => {
    const url = serializeFilters(definitions, values).toString();
    expect(parseFilters(definitions, url)).toEqual(values);
  });

  it('is stable when serialised twice', () => {
    const values = parseFilters(definitions, 'tags=b&tags=a&price_min=1&q=x');
    const once = serializeFilters(definitions, values).toString();
    const twice = serializeFilters(definitions, parseFilters(definitions, once)).toString();
    expect(twice).toBe(once);
  });
});

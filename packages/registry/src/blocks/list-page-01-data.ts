import type { SortingState } from '@tanstack/react-table';
import {
  getSearch,
  parseFilters,
  serializeFilters,
  type FilterDefinition,
  type FilterValues,
} from '@/lib/filter-state';
import type { Locale } from '@/lib/locale';

type LicenceStatus = 'active' | 'pending' | 'suspended' | 'expired';
type LicenceType = 'commercial' | 'professional' | 'vehicle' | 'event';

/** Names are data, not UI chrome: keep both spellings and pick one by locale. */
type Localized = Record<Locale, string>;

interface Licence {
  id: string;
  reference: string;
  holder: Localized;
  type: LicenceType;
  status: LicenceStatus;
  /** `yyyy-mm-dd`. */
  expiresAt: string;
  /** Annual fee in Iraqi dinar. */
  fee: number;
}

/** Everything the list needs to ask the server for one page. */
interface ListPage01Query {
  /** Search text (under `q`) and the filters, keyed like the filter definitions. */
  filters: FilterValues;
  /** 1-based. */
  page: number;
  pageSize: number;
  sorting: SortingState;
}

const DEFAULT_QUERY: ListPage01Query = { filters: {}, page: 1, pageSize: 10, sorting: [] };

const LICENCE_STATUSES: readonly LicenceStatus[] = ['active', 'pending', 'suspended', 'expired'];
const LICENCE_TYPES: readonly LicenceType[] = ['commercial', 'professional', 'vehicle', 'event'];
const SORTABLE_FIELDS = ['reference', 'holder', 'expiresAt', 'fee'] as const;

const HOLDERS: readonly Localized[] = [
  { en: 'Al Noor Trading Co.', ar: 'شركة النور للتجارة' },
  { en: 'Layla Hassan', ar: 'ليلى حسن' },
  { en: 'Rafidain Logistics', ar: 'الرافدين للخدمات اللوجستية' },
  { en: 'Omar Al-Jabouri', ar: 'عمر الجبوري' },
  { en: 'Dijla Medical Center', ar: 'مركز دجلة الطبي' },
  { en: 'Zainab Karim', ar: 'زينب كريم' },
  { en: 'Basra Gulf Services', ar: 'خدمات الخليج البصرة' },
  { en: 'Ahmed Saleh', ar: 'أحمد صالح' },
];
const STATUS_CYCLE: readonly LicenceStatus[] = [
  'active',
  'active',
  'pending',
  'active',
  'suspended',
  'expired',
];

function isoDate(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

/** 26 licences, deterministic so tests and screenshots do not drift. */
const sampleLicences: Licence[] = Array.from({ length: 26 }, (_, index) => {
  const status = STATUS_CYCLE[index % STATUS_CYCLE.length] ?? 'active';
  return {
    id: `lic-${index + 1}`,
    reference: `LIC-${1040 + index}`,
    holder: HOLDERS[index % HOLDERS.length] ?? { en: '', ar: '' },
    type: LICENCE_TYPES[(index * 3) % LICENCE_TYPES.length] ?? 'commercial',
    status,
    expiresAt:
      status === 'expired' ? isoDate(2025, index % 12, 10) : isoDate(2027, 0, 5 + index * 9),
    fee: 150_000 + ((index * 37_500) % 600_000),
  };
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function compare(a: Licence, b: Licence, field: string, locale: Locale): number {
  switch (field) {
    case 'holder':
      return a.holder[locale].localeCompare(b.holder[locale], locale);
    case 'expiresAt':
      return a.expiresAt.localeCompare(b.expiresAt);
    case 'fee':
      return a.fee - b.fee;
    default:
      return a.reference.localeCompare(b.reference);
  }
}

/**
 * Stands in for the server: filters, sorts and slices the full set into the
 * page a list endpoint would return. Real apps send `query` to the API instead.
 */
function queryLicences(
  rows: readonly Licence[],
  query: ListPage01Query,
  locale: Locale = 'en',
): { rows: Licence[]; total: number } {
  const text = getSearch(query.filters).toLowerCase();
  const statuses = stringList(query.filters.status);
  const type = query.filters.type;
  const expires = isRecord(query.filters.expires) ? query.filters.expires : {};
  const from = typeof expires.from === 'string' ? expires.from : undefined;
  const to = typeof expires.to === 'string' ? expires.to : undefined;

  const matching = rows.filter(
    (row) =>
      (text === '' ||
        row.reference.toLowerCase().includes(text) ||
        row.holder.en.toLowerCase().includes(text) ||
        row.holder.ar.includes(text)) &&
      (statuses.length === 0 || statuses.includes(row.status)) &&
      (typeof type !== 'string' || type === '' || row.type === type) &&
      (from === undefined || row.expiresAt >= from) &&
      (to === undefined || row.expiresAt <= to),
  );

  const sort = query.sorting[0];
  const sorted = sort
    ? [...matching].sort((a, b) => {
        const order = compare(a, b, sort.id, locale);
        return sort.desc ? -order : order;
      })
    : matching;

  const start = (query.page - 1) * query.pageSize;
  return { rows: sorted.slice(start, start + query.pageSize), total: sorted.length };
}

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = value === null ? Number.NaN : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** `?q=noor&status=active&page=2&size=25&sort=-expiresAt`; defaults are left out. */
function queryToSearchParams(
  definitions: readonly FilterDefinition[],
  query: ListPage01Query,
): URLSearchParams {
  const params = serializeFilters(definitions, query.filters);
  if (query.page > 1) {
    params.set('page', String(query.page));
  }
  if (query.pageSize !== DEFAULT_QUERY.pageSize) {
    params.set('size', String(query.pageSize));
  }
  const sort = query.sorting[0];
  if (sort) {
    params.set('sort', `${sort.desc ? '-' : ''}${sort.id}`);
  }
  return params;
}

/** Reads a query back from a URL; anything unknown or malformed falls back to the default. */
function searchParamsToQuery(
  definitions: readonly FilterDefinition[],
  source: URLSearchParams | string,
): ListPage01Query {
  const params = typeof source === 'string' ? new URLSearchParams(source) : source;
  const sort = params.get('sort') ?? '';
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  const known = SORTABLE_FIELDS.some((candidate) => candidate === field);
  return {
    filters: parseFilters(definitions, params),
    page: positiveInteger(params.get('page'), DEFAULT_QUERY.page),
    pageSize: positiveInteger(params.get('size'), DEFAULT_QUERY.pageSize),
    sorting: known ? [{ id: field, desc }] : [],
  };
}

export {
  DEFAULT_QUERY,
  LICENCE_STATUSES,
  LICENCE_TYPES,
  queryLicences,
  queryToSearchParams,
  sampleLicences,
  searchParamsToQuery,
};
export type { Licence, LicenceStatus, LicenceType, ListPage01Query, Localized };

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_QUERY,
  queryLicences,
  queryToSearchParams,
  sampleLicences,
  searchParamsToQuery,
} from '@/components/blocks/list-page-01-data';
import type { FilterDefinition } from '@/lib/filter-state';

const definitions: FilterDefinition[] = [
  { key: 'status', type: 'multi-select', label: 'Status', options: [] },
  { key: 'type', type: 'select', label: 'Type', options: [] },
  { key: 'expires', type: 'date-range', label: 'Expires' },
];

describe('queryLicences', () => {
  it('pages the full set and reports the total', () => {
    const first = queryLicences(sampleLicences, DEFAULT_QUERY);
    expect(first.rows).toHaveLength(10);
    expect(first.total).toBe(sampleLicences.length);
    const last = queryLicences(sampleLicences, { ...DEFAULT_QUERY, page: 3 });
    expect(last.rows).toHaveLength(sampleLicences.length - 20);
  });

  it('searches reference and both spellings of the holder', () => {
    const byReference = queryLicences(sampleLicences, {
      ...DEFAULT_QUERY,
      filters: { q: 'lic-1040' },
    });
    expect(byReference.rows.map((row) => row.reference)).toEqual(['LIC-1040']);
    const byArabic = queryLicences(sampleLicences, { ...DEFAULT_QUERY, filters: { q: 'ليلى' } });
    expect(byArabic.total).toBeGreaterThan(0);
    expect(byArabic.rows.every((row) => row.holder.en === 'Layla Hassan')).toBe(true);
  });

  it('combines status, type and expiry filters', () => {
    const { rows, total } = queryLicences(sampleLicences, {
      ...DEFAULT_QUERY,
      pageSize: 50,
      filters: {
        status: ['active', 'pending'],
        type: 'commercial',
        expires: { from: '2027-01-01' },
      },
    });
    expect(total).toBe(rows.length);
    expect(
      rows.every(
        (row) =>
          ['active', 'pending'].includes(row.status) &&
          row.type === 'commercial' &&
          row.expiresAt >= '2027-01-01',
      ),
    ).toBe(true);
  });

  it('sorts ascending and descending by a column', () => {
    const asc = queryLicences(sampleLicences, {
      ...DEFAULT_QUERY,
      sorting: [{ id: 'fee', desc: false }],
    });
    const desc = queryLicences(sampleLicences, {
      ...DEFAULT_QUERY,
      sorting: [{ id: 'fee', desc: true }],
    });
    const fees = asc.rows.map((row) => row.fee);
    expect(fees).toEqual([...fees].sort((a, b) => a - b));
    expect((desc.rows[0]?.fee ?? 0) >= (asc.rows[0]?.fee ?? 0)).toBe(true);
  });

  it('sorts holders in the active language', () => {
    const { rows } = queryLicences(
      sampleLicences,
      { ...DEFAULT_QUERY, sorting: [{ id: 'holder', desc: false }] },
      'ar',
    );
    const names = rows.map((row) => row.holder.ar);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'ar')));
  });
});

describe('query <-> URL', () => {
  it('round-trips a full query', () => {
    const query = {
      filters: { q: 'noor', status: ['active'], type: 'vehicle', expires: { from: '2027-02-01' } },
      page: 2,
      pageSize: 25,
      sorting: [{ id: 'expiresAt', desc: true }],
    };
    const params = queryToSearchParams(definitions, query);
    expect(params.toString()).toContain('sort=-expiresAt');
    expect(searchParamsToQuery(definitions, params)).toEqual(query);
  });

  it('leaves defaults out of the URL', () => {
    expect(queryToSearchParams(definitions, DEFAULT_QUERY).toString()).toBe('');
  });

  it('ignores hand-edited garbage', () => {
    const query = searchParamsToQuery(definitions, 'page=-3&size=abc&sort=password&status=x');
    expect(query.page).toBe(1);
    expect(query.pageSize).toBe(10);
    expect(query.sorting).toEqual([]);
  });
});

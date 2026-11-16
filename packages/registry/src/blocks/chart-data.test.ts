import { renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import {
  deriveConfig,
  describeSeries,
  percentOf,
  pieTotal,
  seriesColorVar,
  seriesName,
  usePieSummary,
  useSeriesSummary,
  type ChartRow,
} from '@/components/blocks/chart-data';
import { LocaleProvider, type Locale } from '@/lib/locale';

const rows: ChartRow[] = [
  { month: 'Jan', sales: 100, cost: 40 },
  { month: 'Feb', sales: 1200, cost: 30 },
  { month: 'Mar', sales: 700, cost: 50 },
];

function wrapperFor(locale: Locale) {
  return ({ children }: { children: ReactNode }) =>
    createElement(LocaleProvider, { locale, children });
}

describe('chart data helpers', () => {
  it('derives a config from the numeric properties, skipping the category', () => {
    expect(Object.keys(deriveConfig(rows, 'month'))).toEqual(['sales', 'cost']);
    expect(deriveConfig([], 'month')).toEqual({});
  });

  it('names a series from its label, or its key for a rich label', () => {
    expect(seriesName({ a: { label: 'Alpha' } }, 'a')).toBe('Alpha');
    expect(seriesName({ a: { label: createElement('b', null, 'Alpha') } }, 'a')).toBe('a');
    expect(seriesName({}, 'missing')).toBe('missing');
  });

  it('builds a colour variable from a safe key', () => {
    expect(seriesColorVar('web')).toBe('var(--color-web)');
    expect(seriesColorVar('a b;c')).toBe('var(--color-abc)');
  });

  it('describes a series with its ends and extremes in Latin digits', () => {
    expect(
      describeSeries(
        rows,
        'month',
        'sales',
        'Sales',
        '{name} {first} {firstLabel} {last} {lastLabel} {max} {maxLabel} {min} {minLabel}',
      ),
    ).toBe('Sales 100 Jan 700 Mar 1,200 Feb 100 Jan');
  });

  it('summarises every series in English and Arabic', () => {
    const config = { sales: { label: 'Sales' }, cost: { label: 'Cost' } };
    const en = renderHook(() => useSeriesSummary(rows, 'month', config), {
      wrapper: wrapperFor('en'),
    });
    expect(en.result.current).toContain('Sales: from 100 in Jan to 700 in Mar');
    expect(en.result.current).toContain('Cost: from 40 in Jan');
    const ar = renderHook(() => useSeriesSummary(rows, 'month', config), {
      wrapper: wrapperFor('ar'),
    });
    expect(ar.result.current).toContain('Sales: من 100 في Jan إلى 700 في Mar');
  });

  it('says there is no data for an empty chart', () => {
    const { result } = renderHook(() => useSeriesSummary([], 'month', {}), {
      wrapper: wrapperFor('en'),
    });
    expect(result.current).toBe('No data to display.');
  });

  it('computes totals and shares, and never divides by zero', () => {
    const slices = [
      { id: 'a', value: 30 },
      { id: 'b', value: 70 },
    ];
    expect(pieTotal(slices)).toBe(100);
    expect(percentOf(30, 100)).toBe('30.0');
    expect(percentOf(0, 0)).toBe('0.0');
  });

  it('summarises a donut with the total and each share', () => {
    const slices = [
      { id: 'a', value: 1000 },
      { id: 'b', value: 3000 },
    ];
    const config = { a: { label: 'Alpha' }, b: { label: 'Beta' } };
    const en = renderHook(() => usePieSummary(slices, config), { wrapper: wrapperFor('en') });
    expect(en.result.current).toBe('Total 4,000. Alpha 1,000 (25.0%); Beta 3,000 (75.0%)');
    const ar = renderHook(() => usePieSummary(slices, config), { wrapper: wrapperFor('ar') });
    expect(ar.result.current).toContain('الإجمالي 4,000');
    const empty = renderHook(() => usePieSummary([], config), { wrapper: wrapperFor('en') });
    expect(empty.result.current).toBe('No data to display.');
  });
});

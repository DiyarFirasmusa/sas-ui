import { renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useCartesianBlock } from '@/components/blocks/chart-cartesian';
import { areaSample } from '@/components/blocks/chart-samples';
import { LocaleProvider, type Locale } from '@/lib/locale';

function wrapperFor(locale: Locale) {
  return ({ children }: { children: ReactNode }) =>
    createElement(LocaleProvider, { locale, children });
}

describe('useCartesianBlock', () => {
  it('falls back to the localised sample for everything that is not given', () => {
    const { result } = renderHook(() => useCartesianBlock({}, areaSample), {
      wrapper: wrapperFor('ar'),
    });
    expect(result.current.card.title).toBe('الزوّار');
    expect(result.current.card.trend?.direction).toBe('up');
    expect(result.current.keys).toEqual(['desktop', 'mobile']);
    expect(result.current.empty).toBe(false);
    expect(result.current.dataTable.categoryLabel).toBe('الفئة');
    expect(result.current.chartLabel).toBe('الزوّار');
  });

  it('does not borrow the sample footer or description for caller data', () => {
    const { result } = renderHook(
      () =>
        useCartesianBlock(
          { title: 'Mine', data: [{ month: 'Jan', total: 3 }], className: 'x' },
          areaSample,
        ),
      { wrapper: wrapperFor('en') },
    );
    expect(result.current.card.description).toBeUndefined();
    expect(result.current.card.trend).toBeUndefined();
    expect(result.current.card.footnote).toBeUndefined();
    expect(result.current.card.className).toBe('x');
    expect(result.current.keys).toEqual(['total']);
    expect(result.current.summary).toContain('total: from 3 in Jan');
  });

  it('treats an empty array as the empty state, not as the sample', () => {
    const { result } = renderHook(() => useCartesianBlock({ data: [] }, areaSample), {
      wrapper: wrapperFor('en'),
    });
    expect(result.current.empty).toBe(true);
    expect(result.current.summary).toBe('No data to display.');
  });

  it('keeps explicit overrides', () => {
    const { result } = renderHook(
      () =>
        useCartesianBlock(
          {
            summary: 'Custom',
            chartLabel: 'Label',
            xLabel: 'Month',
            loading: true,
            reverseTime: false,
          },
          areaSample,
        ),
      { wrapper: wrapperFor('en') },
    );
    expect(result.current.summary).toBe('Custom');
    expect(result.current.chartLabel).toBe('Label');
    expect(result.current.dataTable.categoryLabel).toBe('Month');
    expect(result.current.loading).toBe(true);
    expect(result.current.reverseTime).toBe(false);
  });
});

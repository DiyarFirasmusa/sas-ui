import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  useMultipleSelection,
  useRangeSelection,
  useSingleSelection,
} from '@/hooks/use-calendar-selection';
import { createDate } from '@/lib/date-utils';

const day = (date: number) => createDate(2026, 10, date);

describe('useSingleSelection', () => {
  it('selects one ISO day, uncontrolled', () => {
    const onValueChange = vi.fn();
    const { result } = renderHook(() => useSingleSelection({ onValueChange }));
    expect(result.current.anchor).toBeNull();
    act(() => result.current.select(day(18)));
    expect(onValueChange).toHaveBeenCalledWith('2026-11-18');
    expect(result.current.stateOf(day(18)).selected).toBe(true);
    expect(result.current.stateOf(day(19)).selected).toBe(false);
    expect(result.current.anchor).toEqual(day(18));
  });

  it('follows a controlled value, including an explicit null', () => {
    const initialProps: { value: string | null } = { value: '2026-11-05' };
    const { result, rerender } = renderHook(
      ({ value }: { value: string | null }) => useSingleSelection({ value }),
      { initialProps },
    );
    expect(result.current.stateOf(day(5)).selected).toBe(true);
    rerender({ value: null });
    expect(result.current.stateOf(day(5)).selected).toBe(false);
  });
});

describe('useMultipleSelection', () => {
  it('toggles days and anchors on the earliest', () => {
    const onValueChange = vi.fn();
    const { result } = renderHook(() =>
      useMultipleSelection({ defaultValue: ['2026-11-20'], onValueChange }),
    );
    expect(result.current.multiple).toBe(true);
    act(() => result.current.select(day(3)));
    expect(onValueChange).toHaveBeenLastCalledWith(['2026-11-03', '2026-11-20']);
    expect(result.current.anchor).toEqual(day(3));
    act(() => result.current.select(day(20)));
    expect(onValueChange).toHaveBeenLastCalledWith(['2026-11-03']);
  });
});

describe('useRangeSelection', () => {
  it('describes start, middle and end of a range', () => {
    const { result } = renderHook(() =>
      useRangeSelection({ value: { from: '2026-11-10', to: '2026-11-12' } }),
    );
    expect(result.current.stateOf(day(10))).toMatchObject({
      selected: true,
      rangeStart: true,
      rangeEnd: false,
    });
    expect(result.current.stateOf(day(11))).toMatchObject({
      selected: true,
      rangeMiddle: true,
    });
    expect(result.current.stateOf(day(12))).toMatchObject({
      selected: true,
      rangeEnd: true,
    });
    expect(result.current.stateOf(day(13)).selected).toBe(false);
  });

  it('does not paint a one-day range as start and end', () => {
    const { result } = renderHook(() =>
      useRangeSelection({ value: { from: '2026-11-10', to: '2026-11-10' } }),
    );
    expect(result.current.stateOf(day(10))).toMatchObject({
      selected: true,
      rangeStart: false,
      rangeEnd: false,
    });
  });

  it('builds a range in two selections', () => {
    const onValueChange = vi.fn();
    const { result } = renderHook(() => useRangeSelection({ onValueChange }));
    act(() => result.current.select(day(14)));
    expect(onValueChange).toHaveBeenLastCalledWith({
      from: '2026-11-14',
      to: null,
    });
    act(() => result.current.select(day(10)));
    expect(onValueChange).toHaveBeenLastCalledWith({
      from: '2026-11-10',
      to: '2026-11-14',
    });
  });
});

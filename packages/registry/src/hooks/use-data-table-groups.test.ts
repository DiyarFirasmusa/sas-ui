import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDataTableGroups } from '@/hooks/use-data-table-groups';

interface Item {
  id: number;
  city: string;
}

const rows: Item[] = [
  { id: 1, city: 'عمّان' },
  { id: 2, city: 'Irbid' },
  { id: 3, city: 'عمّان' },
];
const byCity = (item: Item) => item.city;

describe('useDataTableGroups', () => {
  it('lists plain rows when there is no group reader', () => {
    const { result } = renderHook(() => useDataTableGroups({ rows }));
    expect(result.current.grouped).toBe(false);
    expect(result.current.items.map((item) => item.kind)).toEqual(['row', 'row', 'row']);
  });

  it('groups rows and collapses and expands a group', () => {
    const { result } = renderHook(() => useDataTableGroups({ rows, getValue: byCity }));
    expect(result.current.grouped).toBe(true);
    expect(result.current.items.map((item) => item.kind)).toEqual([
      'group',
      'row',
      'row',
      'group',
      'row',
    ]);

    act(() => result.current.toggle('عمّان'));
    expect(result.current.items.map((item) => item.kind)).toEqual(['group', 'group', 'row']);
    expect(result.current.items[0]).toMatchObject({ expanded: false, count: 2 });

    act(() => result.current.toggle('عمّان'));
    expect(result.current.items).toHaveLength(5);
  });

  it('keeps the same items while nothing changes', () => {
    const { result, rerender } = renderHook(() => useDataTableGroups({ rows, getValue: byCity }));
    const first = result.current.items;
    rerender();
    expect(result.current.items).toBe(first);
  });
});

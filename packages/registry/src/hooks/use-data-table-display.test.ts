import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  useDataTableDisplay,
  type UseDataTableDisplayOptions,
} from '@/hooks/use-data-table-display';

interface Item {
  id: string;
  city: string;
}

const data: Item[] = [
  { id: '1', city: 'Amman' },
  { id: '2', city: 'Irbid' },
  { id: '3', city: 'Amman' },
];
const columns: ColumnDef<Item>[] = [
  { accessorKey: 'id', header: 'Id' },
  { accessorKey: 'city', header: 'City' },
];

function setup(options: Partial<UseDataTableDisplayOptions<Item>> = {}) {
  return renderHook(() => {
    const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
    return useDataTableDisplay<Item>({
      rows: table.getRowModel().rows,
      columnCount: 2,
      headerRowCount: 1,
      keyboardNavigation: false,
      ...options,
    });
  });
}

describe('useDataTableDisplay', () => {
  it('has no display model when nothing is switched on', () => {
    const { result } = setup();
    expect(result.current.display).toBeUndefined();
    expect(result.current.grid.virtual).toBeNull();
  });

  it('builds grouped items when groupBy is set', () => {
    const { result } = setup({ groupBy: 'city' });
    const items = result.current.display?.items ?? [];
    expect(items.map((item) => item.kind)).toEqual(['group', 'row', 'row', 'group', 'row']);
    expect(items[0]).toMatchObject({ key: 'Amman', count: 2 });
  });

  it('collapses a group through onToggleGroup', () => {
    const { result } = setup({ groupBy: 'city' });
    act(() => result.current.display?.onToggleGroup('Amman'));
    expect(result.current.display?.items.map((item) => item.kind)).toEqual([
      'group',
      'group',
      'row',
    ]);
  });

  it('turns on for virtualisation and keyboard navigation alone', () => {
    expect(setup({ virtualize: true }).result.current.display).toBeDefined();
    const keyboard = setup({ keyboardNavigation: true }).result.current;
    expect(keyboard.display?.keyboardNavigation).toBe(true);
    expect(keyboard.display?.cellProps(0, 0)).toMatchObject({ role: 'gridcell', tabIndex: 0 });
    expect(keyboard.display?.cellProps(0, 1)).toMatchObject({ tabIndex: -1 });
  });

  it('passes the group callbacks and labels through', () => {
    const groupAggregates = vi.fn();
    const renderGroupLabel = vi.fn();
    const groupLabels = { groupRows: 'lines' };
    const { result } = setup({ groupBy: 'city', groupAggregates, renderGroupLabel, groupLabels });
    expect(result.current.display).toMatchObject({
      groupAggregates,
      renderGroupLabel,
      groupLabels,
    });
  });
});

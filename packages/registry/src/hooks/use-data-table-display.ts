import type { Row } from '@tanstack/react-table';
import { useMemo, type ReactNode } from 'react';
import type { DataTableBodyDisplay } from '@/components/ui/data-table-body';
import type { DataTableGroupLabels } from '@/components/ui/data-table-group-row';
import { useDataTableGrid, type DataTableVirtualize } from '@/hooks/use-data-table-grid';
import { useDataTableGroups } from '@/hooks/use-data-table-groups';

interface UseDataTableDisplayOptions<TData> {
  rows: Row<TData>[];
  columnCount: number;
  headerRowCount: number;
  groupBy?: string;
  virtualize?: DataTableVirtualize;
  keyboardNavigation: boolean;
  onRowClick?: (row: TData) => void;
  renderGroupLabel?: (value: unknown, rows: TData[]) => ReactNode;
  groupAggregates?: (group: { key: string; value: unknown; rows: TData[] }) => ReactNode;
  groupLabels?: DataTableGroupLabels;
}

/**
 * Everything the table body needs beyond plain rows: grouping, the virtual
 * window and the keyboard grid, tied together. `display` is undefined when
 * none of them is on, so a plain table renders exactly as before.
 */
function useDataTableDisplay<TData>({
  rows,
  columnCount,
  headerRowCount,
  groupBy,
  virtualize,
  keyboardNavigation,
  onRowClick,
  renderGroupLabel,
  groupAggregates,
  groupLabels,
}: UseDataTableDisplayOptions<TData>) {
  const groupValue = useMemo(
    () => (groupBy ? (row: Row<TData>) => row.getValue(groupBy) : undefined),
    [groupBy],
  );
  const groups = useDataTableGroups({ rows, getValue: groupValue });
  const grid = useDataTableGrid({
    count: groups.items.length,
    columnCount,
    columnsInRow: (index) => (groups.items[index]?.kind === 'group' ? 1 : columnCount),
    headerRowCount,
    virtualize,
    keyboardNavigation,
    onActivate: (index, hasContent) => {
      const item = groups.items[index];
      if (item?.kind === 'group') {
        groups.toggle(item.key);
        return true;
      }
      if (item && onRowClick && !hasContent) {
        onRowClick(item.row.original);
        return true;
      }
      return false;
    },
  });
  const display: DataTableBodyDisplay<TData> | undefined =
    groups.grouped || grid.virtual || keyboardNavigation
      ? {
          items: groups.items,
          entries: grid.entries,
          rowIndexProps: grid.rowIndexProps,
          rowStyle: grid.rowStyle,
          cellProps: grid.cellProps,
          keyboardNavigation,
          onToggleGroup: groups.toggle,
          renderGroupLabel,
          groupAggregates,
          groupLabels,
        }
      : undefined;
  return { grid, display };
}

export { useDataTableDisplay };
export type { UseDataTableDisplayOptions };

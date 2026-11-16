import { useCallback, useMemo, useState } from 'react';
import { buildDisplayItems, toggleCollapsed, type DisplayItem } from '@/lib/data-table-grouping';

interface UseDataTableGroupsOptions<T> {
  rows: readonly T[];
  /** Reads the value a row is grouped by. Without it nothing is grouped. Keep it stable (memoise it). */
  getValue?: (row: T) => unknown;
}

/** The rows as display items (group headers and rows) plus which groups are collapsed. */
function useDataTableGroups<T>({ rows, getValue }: UseDataTableGroupsOptions<T>) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const items = useMemo<DisplayItem<T>[]>(
    () => buildDisplayItems(rows, getValue, collapsed),
    [rows, getValue, collapsed],
  );
  const toggle = useCallback((key: string) => {
    setCollapsed((current) => toggleCollapsed(current, key));
  }, []);
  return { items, toggle, grouped: getValue !== undefined };
}

export { useDataTableGroups };
export type { UseDataTableGroupsOptions };

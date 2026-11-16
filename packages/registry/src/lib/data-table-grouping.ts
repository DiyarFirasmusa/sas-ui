export interface RowGroup<T> {
  /** Stable string identity of the group; `''` is the group of rows with no value. */
  key: string;
  /** The value the rows share, as read from the data (not stringified). */
  value: unknown;
  rows: T[];
}

export type DisplayItem<T> =
  | {
      kind: 'group';
      key: string;
      value: unknown;
      /** Rows in the group, collapsed or not. */
      count: number;
      expanded: boolean;
      rows: T[];
    }
  | { kind: 'row'; row: T; groupKey?: string };

/** The identity a value groups by: empty values share `''`, dates use their ISO form, the rest `String(value)`. */
export function groupKeyOf(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value) ?? '';
  }
  return String(value);
}

/** Splits rows into groups in the order each value first appears, keeping the rows' own order inside a group. */
export function groupRows<T>(rows: readonly T[], getValue: (row: T) => unknown): RowGroup<T>[] {
  const groups = new Map<string, RowGroup<T>>();
  for (const row of rows) {
    const value = getValue(row);
    const key = groupKeyOf(value);
    const group = groups.get(key);
    if (group) {
      group.rows.push(row);
    } else {
      groups.set(key, { key, value, rows: [row] });
    }
  }
  return [...groups.values()];
}

/** The rows as they are displayed: each group header followed by its rows unless the group is collapsed. */
export function flattenGroups<T>(
  groups: readonly RowGroup<T>[],
  collapsed: ReadonlySet<string>,
): DisplayItem<T>[] {
  const items: DisplayItem<T>[] = [];
  for (const group of groups) {
    const expanded = !collapsed.has(group.key);
    items.push({
      kind: 'group',
      key: group.key,
      value: group.value,
      count: group.rows.length,
      expanded,
      rows: group.rows,
    });
    if (expanded) {
      for (const row of group.rows) {
        items.push({ kind: 'row', row, groupKey: group.key });
      }
    }
  }
  return items;
}

/** The display list for a table: ungrouped when `getValue` is missing, grouped otherwise. */
export function buildDisplayItems<T>(
  rows: readonly T[],
  getValue: ((row: T) => unknown) | undefined,
  collapsed: ReadonlySet<string>,
): DisplayItem<T>[] {
  if (!getValue) {
    return rows.map((row) => ({ kind: 'row', row }));
  }
  return flattenGroups(groupRows(rows, getValue), collapsed);
}

/** A new set with the group's collapsed state flipped; the given set is not changed. */
export function toggleCollapsed(collapsed: ReadonlySet<string>, key: string): Set<string> {
  const next = new Set(collapsed);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  return next;
}

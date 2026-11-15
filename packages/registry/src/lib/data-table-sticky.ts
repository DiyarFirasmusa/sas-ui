import type { DataTableColumnMeta } from '@/lib/data-table-meta';

/** Id of the checkbox column the table adds when `selectable` is on. */
export const SELECT_COLUMN_ID = '__select';

export interface StickyOptions {
  /** Id of the first visible data column (the selection column is not one). */
  firstColumnId?: string;
  lastColumnId?: string;
  stickyFirstColumn: boolean;
  stickyLastColumn: boolean;
  /** A selectable table pins its checkbox column too and offsets the first data column past it. */
  selectable: boolean;
}

export interface StickyResult {
  side?: NonNullable<DataTableColumnMeta['sticky']>;
  className?: string;
}

/** Where a column pins while the table scrolls sideways: its own `meta.sticky` wins over the table-level flags. */
export function resolveSticky(
  columnId: string,
  meta: DataTableColumnMeta,
  options: StickyOptions,
): StickyResult {
  if (meta.sticky) {
    return { side: meta.sticky };
  }
  if (options.stickyFirstColumn && columnId === SELECT_COLUMN_ID) {
    return { side: 'start' };
  }
  if (options.stickyFirstColumn && columnId === options.firstColumnId) {
    return { side: 'start', className: options.selectable ? 'start-12' : undefined };
  }
  if (options.stickyLastColumn && columnId === options.lastColumnId) {
    return { side: 'end' };
  }
  return {};
}

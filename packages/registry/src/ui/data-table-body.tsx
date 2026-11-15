import { flexRender, type Row } from '@tanstack/react-table';
import type { KeyboardEvent, ReactNode } from 'react';
import { isFromControl } from '@/components/ui/data-table-cards';
import { DataTableSkeletonRows, DataTableStateRow } from '@/components/ui/data-table-states';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { readColumnMeta, type DataTableColumnMeta } from '@/lib/data-table-meta';
import type { StickyResult } from '@/lib/data-table-sticky';
import { cn } from '@/lib/utils';

interface DataTableBodyProps<TData> {
  rows: Row<TData>[];
  columnCount: number;
  loading: boolean;
  skeletonRows: number;
  /** Shown in a full-width row instead of the data (the table is in error). */
  errorPanel: ReactNode;
  /** Shown in a full-width row when `showEmpty` is true. */
  emptyPanel: ReactNode;
  showEmpty: boolean;
  onRowClick?: (row: TData) => void;
  stickyOf: (columnId: string, meta: DataTableColumnMeta) => StickyResult;
}

/** The table body: skeleton rows, the error or empty row, and the data rows with their click handling. */
function DataTableBody<TData>({
  rows,
  columnCount,
  loading,
  skeletonRows,
  errorPanel,
  emptyPanel,
  showEmpty,
  onRowClick,
  stickyOf,
}: DataTableBodyProps<TData>) {
  function rowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, original: TData) {
    if (
      onRowClick &&
      event.target === event.currentTarget &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault();
      onRowClick(original);
    }
  }

  return (
    <TableBody>
      {loading ? <DataTableSkeletonRows columnCount={columnCount} rowCount={skeletonRows} /> : null}
      {errorPanel ? (
        <DataTableStateRow columnCount={columnCount}>{errorPanel}</DataTableStateRow>
      ) : null}
      {showEmpty ? (
        <DataTableStateRow columnCount={columnCount}>{emptyPanel}</DataTableStateRow>
      ) : null}
      {rows.map((row) => (
        <TableRow
          key={row.id}
          selected={row.getIsSelected()}
          tabIndex={onRowClick ? 0 : undefined}
          className={cn(
            onRowClick &&
              'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
          )}
          onClick={(event) => {
            if (onRowClick && !isFromControl(event)) {
              onRowClick(row.original);
            }
          }}
          onKeyDown={(event) => rowKeyDown(event, row.original)}
        >
          {row.getVisibleCells().map((cell) => {
            const meta = readColumnMeta(cell.column.columnDef.meta);
            const sticky = stickyOf(cell.column.id, meta);
            return (
              <TableCell
                key={cell.id}
                align={meta.align}
                numeric={meta.numeric}
                sticky={sticky.side}
                className={cn(meta.className, sticky.className)}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </TableBody>
  );
}

export { DataTableBody };
export type { DataTableBodyProps };

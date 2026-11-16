import { flexRender, type Row } from '@tanstack/react-table';
import type { KeyboardEvent, ReactNode } from 'react';
import { isFromControl } from '@/components/ui/data-table-cards';
import { DataTableGroupRow, type DataTableGroupLabels } from '@/components/ui/data-table-group-row';
import { DataTableSkeletonRows, DataTableStateRow } from '@/components/ui/data-table-states';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { GridCellProps, GridEntry } from '@/hooks/use-data-table-grid';
import type { DisplayItem } from '@/lib/data-table-grouping';
import { readColumnMeta, type DataTableColumnMeta } from '@/lib/data-table-meta';
import type { StickyResult } from '@/lib/data-table-sticky';
import { cn } from '@/lib/utils';

/** Grouping, row windowing and keyboard-grid wiring the table passes down; omit it for a plain body. */
interface DataTableBodyDisplay<TData> {
  /** Every displayed row: group headers and data rows. */
  items: DisplayItem<Row<TData>>[];
  /** The part of `items` to render, with spacers between windows. All items when omitted. */
  entries: GridEntry[] | null;
  rowIndexProps: (index: number) => { 'aria-rowindex'?: number };
  rowStyle?: { height: number };
  cellProps: (row: number, column: number) => GridCellProps;
  /** Cells are the tab stops, so rows are not. */
  keyboardNavigation: boolean;
  onToggleGroup: (key: string) => void;
  renderGroupLabel?: (value: unknown, rows: TData[]) => ReactNode;
  groupAggregates?: (group: { key: string; value: unknown; rows: TData[] }) => ReactNode;
  groupLabels?: DataTableGroupLabels;
}

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
  display?: DataTableBodyDisplay<TData>;
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
  display,
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

  const items: DisplayItem<Row<TData>>[] =
    display?.items ?? rows.map((row) => ({ kind: 'row', row }));
  const entries: GridEntry[] =
    display?.entries ?? items.map((_, index) => ({ type: 'row', index }));
  const rowTabStop = onRowClick !== undefined && !display?.keyboardNavigation;

  function renderEntry(entry: GridEntry): ReactNode {
    if (entry.type === 'spacer') {
      return (
        <tr
          key={entry.key}
          aria-hidden="true"
          data-slot="data-table-spacer"
          style={{ height: entry.height }}
        >
          <td colSpan={columnCount} className="p-0" />
        </tr>
      );
    }
    const item = items[entry.index];
    if (!item) {
      return null;
    }
    const rowProps = { ...display?.rowIndexProps(entry.index), style: display?.rowStyle };
    if (item.kind === 'group') {
      return (
        <DataTableGroupRow
          key={`group:${item.key}`}
          columnCount={columnCount}
          value={item.value}
          label={display?.renderGroupLabel?.(
            item.value,
            item.rows.map((row) => row.original),
          )}
          count={item.count}
          expanded={item.expanded}
          onToggle={() => display?.onToggleGroup(item.key)}
          aggregates={display?.groupAggregates?.({
            key: item.key,
            value: item.value,
            rows: item.rows.map((row) => row.original),
          })}
          cellProps={display?.cellProps(entry.index, 0)}
          rowProps={rowProps}
          labels={display?.groupLabels}
        />
      );
    }
    const { row } = item;
    return (
      <TableRow
        key={row.id}
        selected={row.getIsSelected()}
        tabIndex={rowTabStop ? 0 : undefined}
        className={cn(
          'h-[62px]',
          onRowClick &&
            'cursor-pointer outline-none focus-visible:bg-hover-row focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring/40',
        )}
        onClick={(event) => {
          if (onRowClick && !isFromControl(event)) {
            onRowClick(row.original);
          }
        }}
        onKeyDown={(event) => rowKeyDown(event, row.original)}
        {...rowProps}
      >
        {row.getVisibleCells().map((cell, columnIndex) => {
          const meta = readColumnMeta(cell.column.columnDef.meta);
          const sticky = stickyOf(cell.column.id, meta);
          const gridCell = display?.cellProps(entry.index, columnIndex) ?? {};
          return (
            <TableCell
              key={cell.id}
              align={meta.align}
              numeric={meta.numeric}
              sticky={sticky.side}
              {...gridCell}
              className={cn(meta.className, sticky.className, gridCell.className)}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          );
        })}
      </TableRow>
    );
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
      {entries.map(renderEntry)}
    </TableBody>
  );
}

export { DataTableBody };
export type { DataTableBodyDisplay, DataTableBodyProps };

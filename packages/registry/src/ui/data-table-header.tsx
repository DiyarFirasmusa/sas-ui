import { flexRender, type Header, type Row, type Table } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from '@/components/ui/icons';
import { TableHead, TableHeader, TableRow, type StickySide } from '@/components/ui/table';
import { readColumnMeta, type DataTableColumnMeta } from '@/lib/data-table-meta';
import type { StickyResult } from '@/lib/data-table-sticky';
import { cn } from '@/lib/utils';

interface DataTableHeaderCellProps<TData> {
  header: Header<TData, unknown>;
  sticky?: StickySide;
  className?: string;
}

const ariaSort = { asc: 'ascending', desc: 'descending' } as const;

/**
 * A column header. When the column is sortable the label is a button inside
 * the `<th>`, and the `<th>` carries `aria-sort`; the table is sorted by the
 * server, so the button only asks for the next sort state.
 */
function DataTableHeaderCell<TData>({
  header,
  sticky,
  className,
}: DataTableHeaderCellProps<TData>) {
  const { column } = header;
  const meta = readColumnMeta(column.columnDef.meta);
  const sorted = column.getIsSorted();
  const content = header.isPlaceholder
    ? null
    : flexRender(column.columnDef.header, header.getContext());
  const alignEnd = meta.numeric || meta.align === 'end';

  return (
    <TableHead
      align={meta.align}
      numeric={meta.numeric}
      sticky={sticky}
      aria-sort={column.getCanSort() ? (sorted ? ariaSort[sorted] : 'none') : undefined}
      colSpan={header.colSpan}
      className={cn(meta.headerClassName, className)}
    >
      {column.getCanSort() ? (
        <button
          type="button"
          data-slot="data-table-sort"
          className={cn(
            '-mx-2 inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-table-header outline-none',
            'hover:bg-hover-row hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring',
            sorted && 'text-text-primary',
            alignEnd && 'flex-row-reverse',
          )}
          onClick={column.getToggleSortingHandler()}
        >
          {content}
          {sorted === 'asc' ? <ArrowUpIcon className="size-3.5" /> : null}
          {sorted === 'desc' ? <ArrowDownIcon className="size-3.5" /> : null}
          {sorted === false ? <ChevronsUpDownIcon className="text-text-muted size-3.5" /> : null}
        </button>
      ) : (
        content
      )}
    </TableHead>
  );
}

interface DataTableHeaderRowsProps<TData> {
  table: Table<TData>;
  stickyOf: (columnId: string, meta: DataTableColumnMeta) => StickyResult;
  /** `aria-rowindex` of a header row (0-based), set once the body rows are windowed. */
  rowIndexProps?: (index: number) => { 'aria-rowindex'?: number };
}

/** The `<thead>`: one row per header group, each cell sticky as the table's sticky options ask. */
function DataTableHeaderRows<TData>({
  table,
  stickyOf,
  rowIndexProps,
}: DataTableHeaderRowsProps<TData>) {
  return (
    <TableHeader>
      {table.getHeaderGroups().map((group, index) => (
        <TableRow key={group.id} className="hover:bg-transparent" {...rowIndexProps?.(index)}>
          {group.headers.map((header) => {
            const sticky = stickyOf(header.column.id, readColumnMeta(header.column.columnDef.meta));
            return (
              <DataTableHeaderCell
                key={header.id}
                header={header}
                sticky={sticky.side}
                className={sticky.className}
              />
            );
          })}
        </TableRow>
      ))}
    </TableHeader>
  );
}

/** The checkbox that selects one row; `label` names the row for screen readers. */
function DataTableRowCheckbox<TData>({ row, label }: { row: Row<TData>; label: string }) {
  return (
    <Checkbox
      aria-label={label}
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onCheckedChange={(checked) => row.toggleSelected(checked)}
    />
  );
}

/** Header checkbox: checked when every row of the page is selected, indeterminate when some are. */
function DataTableSelectAll<TData>({ table, label }: { table: Table<TData>; label: string }) {
  const all = table.getIsAllPageRowsSelected();
  const some = table.getIsSomePageRowsSelected();
  return (
    <Checkbox
      aria-label={label}
      checked={all}
      indeterminate={!all && some}
      onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)}
    />
  );
}

export { DataTableHeaderCell, DataTableHeaderRows, DataTableRowCheckbox, DataTableSelectAll };
export type { DataTableHeaderCellProps, DataTableHeaderRowsProps };

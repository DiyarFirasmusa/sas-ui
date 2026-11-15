import type { ColumnDef, Row } from '@tanstack/react-table';
import { DataTableRowCheckbox, DataTableSelectAll } from '@/components/ui/data-table-header';
import { SELECT_COLUMN_ID } from '@/lib/data-table-sticky';
import { fillTemplate, formatCount } from '@/lib/format-message';

interface DataTableSelectionLabels {
  selectAll: string;
  selectRow: string;
  selectNamedRow: string;
}

/** Accessible name of a row's checkbox: the row's own label when there is one, else its number. */
function getSelectLabel<TData>(
  row: Row<TData>,
  labels: Pick<DataTableSelectionLabels, 'selectRow' | 'selectNamedRow'>,
  getRowLabel?: (row: TData) => string,
): string {
  return getRowLabel
    ? fillTemplate(labels.selectNamedRow, { name: getRowLabel(row.original) })
    : fillTemplate(labels.selectRow, { number: formatCount(row.index + 1) });
}

/** The leading checkbox column of a selectable table: tri-state header, one checkbox per row. */
function createSelectColumn<TData>(
  labels: DataTableSelectionLabels,
  getRowLabel?: (row: TData) => string,
): ColumnDef<TData> {
  return {
    id: SELECT_COLUMN_ID,
    header: ({ table }) => <DataTableSelectAll table={table} label={labels.selectAll} />,
    cell: ({ row }) => (
      <DataTableRowCheckbox row={row} label={getSelectLabel(row, labels, getRowLabel)} />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      cardRole: 'hidden',
      className: 'w-12 min-w-12',
      headerClassName: 'w-12 min-w-12',
    },
  };
}

export { createSelectColumn, getSelectLabel };
export type { DataTableSelectionLabels };

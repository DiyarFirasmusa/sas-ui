import type { Row, Table } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon, DownloadIcon, SettingsIcon } from '@/components/ui/icons';
import { readColumnMeta } from '@/lib/data-table-meta';
import { fillTemplate, formatCount } from '@/lib/format-message';
import { useLabels, type Messages } from '@/lib/locale';
import { downloadCsv, toCsv, type CsvColumn } from '@/lib/table-export';
import { cn } from '@/lib/utils';

const messages: Messages<
  'columns' | 'selectedCount' | 'clearSelection' | 'bulkActions' | 'export'
> = {
  en: {
    columns: 'Columns',
    selectedCount: '{count} selected on this page',
    clearSelection: 'Clear selection',
    bulkActions: 'Bulk actions',
    export: 'Export',
  },
  ar: {
    columns: 'الأعمدة',
    selectedCount: 'تم تحديد {count} في هذه الصفحة',
    clearSelection: 'إلغاء التحديد',
    bulkActions: 'إجراءات جماعية',
    export: 'تصدير',
  },
};

type DataTableToolbarLabels = Partial<Record<keyof (typeof messages)['en'], string>>;

interface DataTableColumnMenuProps<TData> {
  table: Table<TData>;
  labels?: DataTableToolbarLabels;
}

/** Menu of checkboxes to show and hide columns. Columns with `enableHiding: false` are not listed. */
function DataTableColumnMenu<TData>({ table, labels: overrides }: DataTableColumnMenuProps<TData>) {
  const labels = useLabels(messages, overrides);
  const columns = table.getAllLeafColumns().filter((column) => column.getCanHide());
  if (columns.length === 0) {
    return null;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" />}
        data-slot="data-table-columns"
      >
        <SettingsIcon />
        {labels.columns}
        <ChevronDownIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {columns.map((column) => {
          const header = column.columnDef.header;
          const name =
            readColumnMeta(column.columnDef.meta).label ??
            (typeof header === 'string' ? header : column.id);
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(visible) => column.toggleVisibility(visible)}
            >
              {name}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface DataTableExportButtonProps<TData> {
  table: Table<TData>;
  /** The rows being shown; these are what gets exported. */
  rows: Row<TData>[];
  /** File name without the extension. */
  filename: string;
  /** Takes over the export, for example to ask the server for every row. Without it a CSV of `rows` is downloaded. */
  onExport?: (rows: TData[]) => void;
  disabled?: boolean;
  labels?: DataTableToolbarLabels;
}

/**
 * "Export" button. Exports the visible columns that have data (not the
 * checkbox or actions columns) as raw values in an Excel-safe CSV.
 */
function DataTableExportButton<TData>({
  table,
  rows,
  filename,
  onExport,
  disabled = false,
  labels: overrides,
}: DataTableExportButtonProps<TData>) {
  const labels = useLabels(messages, overrides);
  function exportRows() {
    if (onExport) {
      onExport(rows.map((row) => row.original));
      return;
    }
    const columns: CsvColumn<Row<TData>>[] = table
      .getVisibleLeafColumns()
      .filter((column) => column.accessorFn !== undefined)
      .map((column) => {
        const header = column.columnDef.header;
        return {
          header:
            readColumnMeta(column.columnDef.meta).label ??
            (typeof header === 'string' ? header : column.id),
          value: (row) => row.getValue(column.id),
        };
      });
    downloadCsv(filename, toCsv(columns, rows));
  }
  return (
    <Button
      variant="outline"
      size="sm"
      data-slot="data-table-export"
      disabled={disabled || rows.length === 0}
      onClick={exportRows}
    >
      <DownloadIcon />
      {labels.export}
    </Button>
  );
}

interface DataTableBulkBarProps {
  count: number;
  onClear: () => void;
  /** The actions for the selected rows. */
  children?: ReactNode;
  labels?: DataTableToolbarLabels;
  className?: string;
}

/**
 * Appears above the table while rows are selected: the count, your actions and
 * "clear". The table announces the count; the bar itself is a labelled toolbar.
 */
function DataTableBulkBar({
  count,
  onClear,
  children,
  labels: overrides,
  className,
}: DataTableBulkBarProps) {
  const labels = useLabels(messages, overrides);
  return (
    <div
      role="toolbar"
      aria-label={labels.bulkActions}
      data-slot="data-table-bulk-bar"
      className={cn(
        'flex flex-wrap items-center gap-inline rounded-control border border-primary-highlight bg-primary-tint px-row py-field',
        className,
      )}
    >
      <p className="text-h5 text-text-primary tabular-nums">
        {fillTemplate(labels.selectedCount, { count: formatCount(count) })}
      </p>
      <div className="gap-field flex flex-wrap items-center">{children}</div>
      <Button variant="ghost" size="sm" className="ms-auto" onClick={onClear}>
        {labels.clearSelection}
      </Button>
    </div>
  );
}

interface DataTableTopBarProps<TData> extends Omit<DataTableExportButtonProps<TData>, 'labels'> {
  /** Filters, search and other controls on the start side. */
  children?: ReactNode;
  exportable: boolean;
  columnMenu: boolean;
  labels?: DataTableToolbarLabels;
}

/** The row above the table: the caller's controls, then export and the column menu. */
function DataTableTopBar<TData>({
  children,
  exportable,
  columnMenu,
  labels,
  ...exportProps
}: DataTableTopBarProps<TData>) {
  if (!children && !columnMenu && !exportable) {
    return null;
  }
  return (
    <div className="gap-field flex flex-wrap items-center justify-between">
      <div className="gap-field flex min-w-0 flex-1 flex-wrap items-center">{children}</div>
      <div className="gap-field flex items-center">
        {exportable ? <DataTableExportButton {...exportProps} labels={labels} /> : null}
        {columnMenu ? <DataTableColumnMenu table={exportProps.table} labels={labels} /> : null}
      </div>
    </div>
  );
}

/** Panel heading: the title and the row count beside it. */
function DataTableTitle({ title, count }: { title: ReactNode; count: number }) {
  return (
    <div data-slot="data-table-title" className="gap-field flex items-center justify-between">
      <h2 className="text-h4 text-text-primary">{title}</h2>
      <span className="text-b3 text-text-muted tabular-nums">{formatCount(count)}</span>
    </div>
  );
}

export {
  DataTableBulkBar,
  DataTableColumnMenu,
  DataTableExportButton,
  DataTableTitle,
  DataTableTopBar,
};
export type {
  DataTableBulkBarProps,
  DataTableColumnMenuProps,
  DataTableExportButtonProps,
  DataTableToolbarLabels,
};

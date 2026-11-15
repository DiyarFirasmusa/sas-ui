import type { Table } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon, SettingsIcon } from '@/components/ui/icons';
import { readColumnMeta } from '@/lib/data-table-meta';
import { fillTemplate, formatCount } from '@/lib/format-message';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'columns' | 'selectedCount' | 'clearSelection' | 'bulkActions'> = {
  en: {
    columns: 'Columns',
    selectedCount: '{count} selected on this page',
    clearSelection: 'Clear selection',
    bulkActions: 'Bulk actions',
  },
  ar: {
    columns: 'الأعمدة',
    selectedCount: 'تم تحديد {count} في هذه الصفحة',
    clearSelection: 'إلغاء التحديد',
    bulkActions: 'إجراءات جماعية',
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
      <DropdownMenuTrigger render={<Button variant="outline" />} data-slot="data-table-columns">
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
        'flex flex-wrap items-center gap-inline rounded-lg border border-primary-highlight bg-primary-tint px-row py-field',
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

export { DataTableBulkBar, DataTableColumnMenu };
export type { DataTableBulkBarProps, DataTableColumnMenuProps, DataTableToolbarLabels };

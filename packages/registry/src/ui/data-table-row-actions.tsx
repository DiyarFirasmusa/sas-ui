import type { ColumnDef } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontalIcon } from '@/components/ui/icons';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'actions'> = {
  en: { actions: 'Actions' },
  ar: { actions: 'الإجراءات' },
};

interface RowAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  /** Styles the action as destructive (delete, revoke…) and groups it last. */
  destructive?: boolean;
  disabled?: boolean;
}

interface RowActionsProps {
  /** Only list actions the user may run: a missing action is better than a disabled one. */
  actions: readonly RowAction[];
  /** Accessible name of the menu button; name the row ("Actions for Ali"). */
  label?: string;
  className?: string;
}

/**
 * The "…" menu at the end of a row. Renders nothing when there are no actions.
 * Destructive actions are separated and listed last, whatever order they were given in.
 */
function RowActions({ actions, label, className }: RowActionsProps) {
  const labels = useLabels(messages, label ? { actions: label } : undefined);
  if (actions.length === 0) {
    return null;
  }
  const regular = actions.filter((action) => !action.destructive);
  const destructive = actions.filter((action) => action.destructive);
  const item = (action: RowAction) => (
    <DropdownMenuItem
      key={action.id}
      destructive={action.destructive}
      disabled={action.disabled}
      onClick={action.onSelect}
    >
      {action.icon}
      {action.label}
    </DropdownMenuItem>
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={labels.actions}
        data-slot="row-actions"
        className={cn(
          // The dashboards' "⋯" trigger: a borderless square that tints on hover and while open.
          'inline-flex size-control-sm shrink-0 cursor-pointer items-center justify-center rounded-control border border-transparent text-text-secondary outline-none transition-colors max-sm:size-11 motion-reduce:transition-none [&>svg]:size-4.5',
          'hover:bg-hover-row hover:text-text-primary data-[popup-open]:bg-hover-row data-[popup-open]:text-text-primary',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-highlight',
          className,
        )}
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {regular.map(item)}
        {regular.length > 0 && destructive.length > 0 ? <DropdownMenuSeparator /> : null}
        {destructive.map(item)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ActionsHeader() {
  const labels = useLabels(messages);
  return <span className="sr-only">{labels.actions}</span>;
}

interface ActionsColumnOptions<TData> {
  /** Names the menu per row, for example `(row) => `Actions for ${row.name}``. */
  getLabel?: (row: TData) => string;
  /** Pin the column to the end edge while the table scrolls sideways. */
  sticky?: boolean;
}

/**
 * Column helper: an actions column driven by `getActions(row)`. It cannot be
 * sorted or hidden and, in the mobile card layout, sits in the card corner.
 */
function actionsColumn<TData>(
  getActions: (row: TData) => readonly RowAction[],
  { getLabel, sticky = false }: ActionsColumnOptions<TData> = {},
): ColumnDef<TData> {
  return {
    id: 'actions',
    header: () => <ActionsHeader />,
    cell: ({ row }) => (
      <RowActions actions={getActions(row.original)} label={getLabel?.(row.original)} />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      align: 'end',
      cardRole: 'actions',
      sticky: sticky ? 'end' : undefined,
    },
  };
}

export { RowActions, actionsColumn };
export type { ActionsColumnOptions, RowAction, RowActionsProps };

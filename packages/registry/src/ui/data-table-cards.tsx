import { flexRender, type Cell, type Row, type Table } from '@tanstack/react-table';
import type { MouseEvent, ReactNode } from 'react';
import { DataTableRowCheckbox } from '@/components/ui/data-table-header';
import { readColumnMeta } from '@/lib/data-table-meta';
import { cn } from '@/lib/utils';

interface MobileCardContext<TData> {
  row: Row<TData>;
  selected: boolean;
  toggleSelected: (value?: boolean) => void;
  /** The row's selection checkbox, or null when the table is not selectable. */
  selectionControl: ReactNode;
}

interface DataTableCardsProps<TData> {
  table: Table<TData>;
  /** Replaces the default card built from the column metadata. */
  renderMobileCard?: (row: TData, context: MobileCardContext<TData>) => ReactNode;
  onRowClick?: (row: TData) => void;
  /** Accessible name of a row's selection checkbox; omit when rows are not selectable. */
  getSelectLabel?: (row: Row<TData>) => string;
  className?: string;
}

const SELECT_COLUMN_ID = '__select';

function columnName<TData>(cell: Cell<TData, unknown>): string {
  const { columnDef, id } = cell.column;
  const header = columnDef.header;
  return readColumnMeta(columnDef.meta).label ?? (typeof header === 'string' ? header : id);
}

/** True when the click came from a control inside the card rather than the card itself. */
function isFromControl(event: MouseEvent<HTMLElement>): boolean {
  const target = event.target;
  return (
    !(target instanceof Element) ||
    !event.currentTarget.contains(target) ||
    target.closest('button, a, input, select, textarea, [role="checkbox"], [role="menuitem"]') !==
      null
  );
}

/**
 * Mobile layout: each row as a card with a title, the actions in the corner
 * and the other cells as label/value lines. Hidden from the sm breakpoint up,
 * where the real table shows instead.
 */
function DataTableCards<TData>({
  table,
  renderMobileCard,
  onRowClick,
  getSelectLabel,
  className,
}: DataTableCardsProps<TData>) {
  return (
    <ul
      data-slot="data-table-cards"
      className={cn('flex flex-col gap-inline sm:hidden', className)}
    >
      {table.getRowModel().rows.map((row) => {
        const selectionControl = getSelectLabel ? (
          <DataTableRowCheckbox row={row} label={getSelectLabel(row)} />
        ) : null;
        const cells = row
          .getVisibleCells()
          .filter((cell) => cell.column.id !== SELECT_COLUMN_ID)
          .map((cell) => ({
            cell,
            role: readColumnMeta(cell.column.columnDef.meta).cardRole ?? 'field',
          }))
          .filter((entry) => entry.role !== 'hidden');
        const title =
          cells.find((entry) => entry.role === 'title') ??
          cells.find((entry) => entry.role === 'field');
        const actions = cells.filter((entry) => entry.role === 'actions');
        const fields = cells.filter((entry) => entry.role === 'field' && entry !== title);

        return (
          <li
            key={row.id}
            data-slot="data-table-card"
            data-state={row.getIsSelected() ? 'selected' : undefined}
            className={cn(
              'rounded-lg border border-stroke bg-surface p-row',
              'data-[state=selected]:border-primary-highlight data-[state=selected]:bg-primary-tint',
              onRowClick && 'cursor-pointer',
            )}
            onClick={(event) => {
              if (onRowClick && !isFromControl(event)) {
                onRowClick(row.original);
              }
            }}
          >
            {renderMobileCard ? (
              renderMobileCard(row.original, {
                row,
                selected: row.getIsSelected(),
                toggleSelected: (value) => row.toggleSelected(value),
                selectionControl,
              })
            ) : (
              <div className="gap-inline flex flex-col">
                <div className="gap-inline flex items-center">
                  {selectionControl}
                  <div className="text-h5 text-text-primary min-w-0 flex-1">
                    {title
                      ? flexRender(title.cell.column.columnDef.cell, title.cell.getContext())
                      : null}
                  </div>
                  {actions.map(({ cell }) => (
                    <div key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>
                {fields.length > 0 ? (
                  <dl className="gap-x-inline gap-y-field text-b2 grid grid-cols-[auto_1fr]">
                    {fields.map(({ cell }) => (
                      <div
                        key={cell.id}
                        className="col-span-2 grid grid-cols-subgrid items-baseline"
                      >
                        <dt className="text-text-muted">{columnName(cell)}</dt>
                        <dd className="text-text-primary min-w-0">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export { DataTableCards, isFromControl };
export type { DataTableCardsProps, MobileCardContext };

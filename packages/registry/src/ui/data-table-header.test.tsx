import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  DataTableHeaderCell,
  DataTableHeaderRows,
  DataTableRowCheckbox,
  DataTableSelectAll,
} from '@/components/ui/data-table-header';
import { Table, TableBody, TableHeader, TableRow } from '@/components/ui/table';
import { expectNoA11yViolations } from '@/test/a11y';

interface Item {
  id: string;
  name: string;
  total: number;
}

const items: Item[] = [
  { id: 'a', name: 'One', total: 1 },
  { id: 'b', name: 'Two', total: 2 },
];

const columns: ColumnDef<Item>[] = [
  { accessorKey: 'name', header: 'Name' },
  {
    accessorKey: 'total',
    header: 'Total',
    meta: { numeric: true, headerClassName: 'custom-head' },
  },
  { id: 'fixed', header: 'Fixed', enableSorting: false },
];

function Harness({
  sorting = [],
  onSortingChange,
  withSelection = false,
}: {
  sorting?: SortingState;
  onSortingChange?: (next: SortingState) => void;
  withSelection?: boolean;
}) {
  const [selection, setSelection] = useState<RowSelectionState>({});
  const table = useReactTable({
    data: items,
    columns,
    getRowId: (item) => item.id,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    enableSorting: onSortingChange !== undefined,
    state: { sorting, rowSelection: selection },
    onSortingChange: (updater) =>
      onSortingChange?.(typeof updater === 'function' ? updater(sorting) : updater),
    onRowSelectionChange: (updater) =>
      setSelection(typeof updater === 'function' ? updater(selection) : updater),
  });
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {table.getHeaderGroups()[0]?.headers.map((header) => (
            <DataTableHeaderCell key={header.id} header={header} />
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {withSelection ? (
          <TableRow>
            <td>
              <DataTableSelectAll table={table} label="Select all" />
            </td>
            {table.getRowModel().rows.map((row) => (
              <td key={row.id}>
                <DataTableRowCheckbox row={row} label={`Select ${row.original.name}`} />
              </td>
            ))}
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}

describe('DataTableHeaderCell', () => {
  it('renders plain headers when sorting is off', () => {
    render(<Harness />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).not.toHaveAttribute('aria-sort');
  });

  it('renders sortable headers as buttons inside a th with aria-sort', () => {
    render(<Harness onSortingChange={() => {}} sorting={[{ id: 'total', desc: false }]} />);
    const th = screen.getByRole('columnheader', { name: 'Total' });
    expect(th).toHaveAttribute('aria-sort', 'ascending');
    expect(th).toContainElement(screen.getByRole('button', { name: 'Total' }));
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'none');
    expect(screen.getByRole('columnheader', { name: 'Fixed' })).not.toHaveAttribute('aria-sort');
  });

  it('asks for the next sort state on click and Enter', async () => {
    const onSortingChange = vi.fn();
    render(<Harness onSortingChange={onSortingChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(onSortingChange).toHaveBeenLastCalledWith([{ id: 'name', desc: false }]);
    screen.getByRole('button', { name: 'Total' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onSortingChange).toHaveBeenLastCalledWith([{ id: 'total', desc: true }]);
  });

  it('applies column meta classes and numeric alignment', () => {
    render(<Harness />);
    const th = screen.getByRole('columnheader', { name: 'Total' });
    expect(th).toHaveClass('custom-head', 'text-end', 'tabular-nums');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Harness onSortingChange={() => {}} sorting={[{ id: 'name', desc: true }]} />,
    );
    await expectNoA11yViolations(container);
  });
});

describe('DataTableHeaderRows', () => {
  function Rows({ numbered = false }: { numbered?: boolean }) {
    const table = useReactTable({
      data: items,
      columns,
      getCoreRowModel: getCoreRowModel(),
    });
    return (
      <Table aria-label="Items">
        <DataTableHeaderRows
          table={table}
          stickyOf={(columnId) =>
            columnId === 'name' ? { side: 'start', className: 'pinned' } : {}
          }
          rowIndexProps={numbered ? (index) => ({ 'aria-rowindex': index + 1 }) : undefined}
        />
      </Table>
    );
  }

  it('renders one header cell per column and applies the sticky result', () => {
    render(<Rows />);
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Name',
      'Total',
      'Fixed',
    ]);
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveClass('sticky', 'pinned');
    expect(screen.getByRole('row')).not.toHaveAttribute('aria-rowindex');
  });

  it('numbers the header row when asked, for windowed bodies', () => {
    render(<Rows numbered />);
    expect(screen.getByRole('row')).toHaveAttribute('aria-rowindex', '1');
  });
});

describe('selection checkboxes', () => {
  it('shows a tri-state select-all and per-row boxes', async () => {
    render(<Harness withSelection />);
    const all = screen.getByRole('checkbox', { name: 'Select all' });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select One' }));
    expect(all).toHaveAttribute('aria-checked', 'mixed');
    await userEvent.click(all);
    expect(all).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Select Two' })).toBeChecked();
    await userEvent.click(all);
    expect(all).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Select One' })).not.toBeChecked();
  });
});

import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTableBody, type DataTableBodyProps } from '@/components/ui/data-table-body';
import { Table } from '@/components/ui/table';
import { expectNoA11yViolations } from '@/test/a11y';

interface Item {
  id: string;
  name: string;
  total: number;
}

const items: Item[] = [
  { id: 'a', name: 'Invoice A', total: 10 },
  { id: 'b', name: 'Invoice B', total: 20 },
];

const columns: ColumnDef<Item>[] = [
  { accessorKey: 'name', header: 'Name', meta: { className: 'name-cell' } },
  { accessorKey: 'total', header: 'Total', meta: { numeric: true } },
  {
    id: 'open',
    header: 'Open',
    cell: ({ row }) => <button type="button">Open {row.original.name}</button>,
  },
];

type Overrides = Partial<Omit<DataTableBodyProps<Item>, 'rows' | 'columnCount'>> & {
  data?: Item[];
};

function Harness({ data = items, ...props }: Overrides) {
  const table = useReactTable({
    data,
    columns,
    getRowId: (item) => item.id,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <Table aria-label="Items">
      <DataTableBody
        rows={table.getRowModel().rows}
        columnCount={3}
        loading={false}
        skeletonRows={2}
        errorPanel={null}
        emptyPanel={<p>Nothing here</p>}
        showEmpty={false}
        stickyOf={() => ({})}
        {...props}
      />
    </Table>
  );
}

function bodyRows() {
  return screen.getAllByRole('row');
}

describe('DataTableBody', () => {
  it('renders a row per item with the column classes and numeric alignment', () => {
    render(<Harness />);
    expect(bodyRows()).toHaveLength(2);
    expect(screen.getByRole('cell', { name: 'Invoice A' })).toHaveClass('name-cell');
    expect(screen.getByRole('cell', { name: '20' })).toHaveClass('text-end', 'tabular-nums');
  });

  it('applies the sticky side and class from stickyOf', () => {
    render(
      <Harness
        stickyOf={(columnId) =>
          columnId === 'name' ? { side: 'start', className: 'start-12' } : {}
        }
      />,
    );
    expect(screen.getByRole('cell', { name: 'Invoice A' })).toHaveClass('sticky', 'start-12');
    expect(screen.getByRole('cell', { name: '10' })).not.toHaveClass('sticky');
  });

  it('shows skeleton rows while loading', () => {
    render(<Harness data={[]} loading skeletonRows={3} />);
    expect(document.querySelectorAll('[data-slot="data-table-skeleton-row"]')).toHaveLength(3);
    expect(screen.queryByText('Nothing here')).not.toBeInTheDocument();
  });

  it('shows the error panel and the empty panel in a full-width row', () => {
    const { rerender } = render(<Harness data={[]} errorPanel={<p>Broke</p>} />);
    expect(within(screen.getByRole('cell')).getByText('Broke')).toBeInTheDocument();
    expect(screen.getByRole('cell')).toHaveAttribute('colspan', '3');

    rerender(<Harness data={[]} showEmpty />);
    expect(within(screen.getByRole('cell')).getByText('Nothing here')).toBeInTheDocument();
  });

  it('makes rows focusable and clickable only with onRowClick', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const { rerender } = render(<Harness />);
    expect(bodyRows()[0]).not.toHaveAttribute('tabindex');

    rerender(<Harness onRowClick={onRowClick} />);
    expect(bodyRows()[0]).toHaveAttribute('tabindex', '0');
    await user.click(screen.getByRole('cell', { name: 'Invoice B' }));
    expect(onRowClick).toHaveBeenLastCalledWith(items[1]);
  });

  it('activates a focused row with Enter and Space, but not from a control inside it', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<Harness onRowClick={onRowClick} />);
    bodyRows()[0]?.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onRowClick).toHaveBeenCalledTimes(2);

    onRowClick.mockClear();
    await user.click(screen.getByRole('button', { name: 'Open Invoice A' }));
    await user.keyboard('{Enter}');
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Harness />);
    await expectNoA11yViolations(container);
  });
});

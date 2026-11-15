import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTableMobile, type DataTableMobileProps } from '@/components/ui/data-table-mobile';
import { expectNoA11yViolations } from '@/test/a11y';

interface Item {
  id: string;
  name: string;
  status: string;
}

const items: Item[] = [
  { id: 'a', name: 'Invoice A', status: 'Paid' },
  { id: 'b', name: 'Invoice B', status: 'Due' },
];

const columns: ColumnDef<Item>[] = [
  { accessorKey: 'name', header: 'Name', meta: { cardRole: 'title' } },
  { accessorKey: 'status', header: 'Status' },
];

type Overrides = Partial<Omit<DataTableMobileProps<Item>, 'table'>> & { data?: Item[] };

function Harness({ data = items, ...props }: Overrides) {
  const table = useReactTable({
    data,
    columns,
    getRowId: (item) => item.id,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <DataTableMobile
      table={table}
      rowCount={data.length}
      loading={false}
      skeletonRows={2}
      errorPanel={null}
      emptyPanel={<p>Nothing here</p>}
      {...props}
    />
  );
}

describe('DataTableMobile', () => {
  it('renders a card per row, hidden from the sm breakpoint up', () => {
    const { container } = render(<Harness />);
    expect(container.querySelector('[data-slot="data-table-mobile"]')).toHaveClass('sm:hidden');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Invoice A')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('shows skeleton cards while loading', () => {
    render(<Harness data={[]} rowCount={0} loading skeletonRows={3} />);
    expect(document.querySelectorAll('[data-slot="data-table-skeleton-card"]')).toHaveLength(3);
    expect(screen.queryByText('Nothing here')).not.toBeInTheDocument();
  });

  it('shows the error panel before the empty panel', () => {
    render(<Harness data={[]} rowCount={0} errorPanel={<p>Broke</p>} />);
    expect(screen.getByText('Broke')).toBeInTheDocument();
    expect(screen.queryByText('Nothing here')).not.toBeInTheDocument();
  });

  it('shows the empty panel when there are no rows', () => {
    render(<Harness data={[]} rowCount={0} />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('passes the row click and selection label through to the cards', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(
      <Harness onRowClick={onRowClick} getSelectLabel={(row) => `Select ${row.original.name}`} />,
    );
    await user.click(screen.getByText('Invoice B'));
    expect(onRowClick).toHaveBeenCalledWith(items[1]);
    expect(screen.getByRole('checkbox', { name: 'Select Invoice A' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Harness />);
    await expectNoA11yViolations(container);
  });
});

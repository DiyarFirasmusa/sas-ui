import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from '@tanstack/react-table';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  DataTableCards,
  isFromControl,
  type DataTableCardsProps,
} from '@/components/ui/data-table-cards';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

interface Item {
  id: string;
  name: string;
  status: string;
  total: number;
}

const items: Item[] = [
  { id: 'a', name: 'Invoice A', status: 'Paid', total: 10 },
  { id: 'b', name: 'Invoice B', status: 'Due', total: 20 },
];

const columns: ColumnDef<Item>[] = [
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'name', header: 'Name', meta: { cardRole: 'title' } },
  { accessorKey: 'total', header: 'Total' },
  {
    id: 'hidden',
    header: 'Internal',
    cell: () => 'secret',
    meta: { cardRole: 'hidden' },
  },
  {
    id: 'menu',
    header: 'Menu',
    cell: ({ row }) => <button type="button">Open {row.original.name}</button>,
    meta: { cardRole: 'actions' },
  },
];

function Harness(props: Partial<DataTableCardsProps<Item>> & { cols?: ColumnDef<Item>[] }) {
  const { cols = columns, ...rest } = props;
  const [selection, setSelection] = useState<RowSelectionState>({});
  const table = useReactTable({
    data: items,
    columns: cols,
    getRowId: (item) => item.id,
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection: selection },
    onRowSelectionChange: (updater) =>
      setSelection(typeof updater === 'function' ? updater(selection) : updater),
  });
  return <DataTableCards table={table} {...rest} />;
}

function card(index: number): HTMLElement {
  const element = screen.getAllByRole('listitem')[index];
  if (!element) {
    throw new Error(`no card ${index}`);
  }
  return element;
}

describe('DataTableCards', () => {
  it('builds a card per row: title, corner actions and labelled fields', () => {
    render(<Harness />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    const first = within(card(0));
    expect(first.getByText('Invoice A')).toBeInTheDocument();
    expect(first.getByText('Status')).toBeInTheDocument();
    expect(first.getByText('Paid')).toBeInTheDocument();
    expect(first.getByText('Total')).toBeInTheDocument();
    expect(first.getByRole('button', { name: 'Open Invoice A' })).toBeInTheDocument();
    expect(first.queryByText('secret')).not.toBeInTheDocument();
    expect(first.queryByText('Internal')).not.toBeInTheDocument();
    expect(first.queryByText('Name')).not.toBeInTheDocument();
  });

  it('uses the first field as the title when no column says so', () => {
    render(
      <Harness
        cols={columns.filter(
          (column) =>
            column.id !== 'name' && !('accessorKey' in column && column.accessorKey === 'name'),
        )}
      />,
    );
    const first = within(card(0));
    expect(first.getByText('Paid')).toBeInTheDocument();
    expect(first.queryByText('Status')).not.toBeInTheDocument();
    expect(first.getByText('Total')).toBeInTheDocument();
  });

  it('is hidden from the sm breakpoint up', () => {
    render(<Harness />);
    expect(screen.getByRole('list')).toHaveClass('sm:hidden');
  });

  it('adds selection checkboxes when given labels', async () => {
    render(<Harness getSelectLabel={(row) => `Select ${row.original.name}`} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Invoice B' }));
    expect(card(1)).toHaveAttribute('data-state', 'selected');
    expect(card(0)).not.toHaveAttribute('data-state');
  });

  it('runs onRowClick for the card but not for its buttons or checkbox', async () => {
    const onRowClick = vi.fn();
    render(
      <Harness onRowClick={onRowClick} getSelectLabel={(row) => `Select ${row.original.name}`} />,
    );
    await userEvent.click(within(card(1)).getByText('Due'));
    expect(onRowClick).toHaveBeenCalledWith(items[1]);
    await userEvent.click(screen.getByRole('button', { name: 'Open Invoice A' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Invoice A' }));
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });

  it('renders a custom card with the selection helpers', async () => {
    render(
      <Harness
        getSelectLabel={() => 'Pick'}
        renderMobileCard={(item, { selected, toggleSelected }) => (
          <button type="button" onClick={() => toggleSelected()}>
            {item.name} {selected ? 'on' : 'off'}
          </button>
        )}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Invoice A off' }));
    expect(screen.getByRole('button', { name: 'Invoice A on' })).toBeInTheDocument();
  });

  it('works in Arabic and has no axe violations', async () => {
    const { container } = renderWithLocale(
      <Harness getSelectLabel={(row) => `تحديد ${row.original.name}`} />,
      { locale: 'ar' },
    );
    expect(screen.getByRole('checkbox', { name: 'تحديد Invoice A' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});

describe('isFromControl', () => {
  it('is true for clicks that start on interactive elements', () => {
    const received: boolean[] = [];
    render(
      <div onClick={(event) => received.push(isFromControl(event))}>
        <button type="button">Go</button>
        <span>Plain</span>
      </div>,
    );
    screen.getByRole('button', { name: 'Go' }).click();
    screen.getByText('Plain').click();
    expect(received).toEqual([true, false]);
  });
});

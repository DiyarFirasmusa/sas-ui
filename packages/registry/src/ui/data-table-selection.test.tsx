import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { createSelectColumn, getSelectLabel } from '@/components/ui/data-table-selection';
import { SELECT_COLUMN_ID } from '@/lib/data-table-sticky';
import { expectNoA11yViolations } from '@/test/a11y';

interface Item {
  id: string;
  name: string;
}

const items: Item[] = [
  { id: 'a', name: 'Ali' },
  { id: 'b', name: 'Sara' },
];

const labels = {
  selectAll: 'Select all rows on this page',
  selectRow: 'Select row {number}',
  selectNamedRow: 'Select {name}',
};

function Harness({ getRowLabel }: { getRowLabel?: (row: Item) => string }) {
  const [selection, setSelection] = useState<RowSelectionState>({});
  const columns: ColumnDef<Item>[] = [
    createSelectColumn<Item>(labels, getRowLabel),
    { accessorKey: 'name', header: 'Name' },
  ];
  const table = useReactTable({
    data: items,
    columns,
    getRowId: (item) => item.id,
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection: selection },
    onRowSelectionChange: setSelection,
  });
  return (
    <div>
      {table.getHeaderGroups().map((group) => (
        <div key={group.id}>
          {group.headers.map((header) => (
            <span key={header.id}>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </span>
          ))}
        </div>
      ))}
      {table.getRowModel().rows.map((row) => (
        <div key={row.id}>
          {row.getVisibleCells().map((cell) => (
            <span key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</span>
          ))}
        </div>
      ))}
      <output>{Object.keys(selection).join(',')}</output>
    </div>
  );
}

describe('createSelectColumn', () => {
  it('is an unsortable, unhideable column kept out of mobile cards', () => {
    const column = createSelectColumn<Item>(labels);
    expect(column.id).toBe(SELECT_COLUMN_ID);
    expect(column.enableSorting).toBe(false);
    expect(column.enableHiding).toBe(false);
    expect(column.meta).toMatchObject({ cardRole: 'hidden', className: 'w-12 min-w-12' });
  });

  it('renders a labelled header checkbox and a numbered checkbox per row', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getByRole('checkbox', { name: labels.selectAll })).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Select row 2' }));
    expect(screen.getByRole('status')).toHaveTextContent('b');
    expect(screen.getByRole('checkbox', { name: 'Select row 2' })).toBeChecked();
  });

  it('names row checkboxes from getRowLabel and selects all from the header', async () => {
    const user = userEvent.setup();
    render(<Harness getRowLabel={(item) => item.name} />);
    expect(screen.getByRole('checkbox', { name: 'Select Ali' })).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: labels.selectAll }));
    expect(screen.getByRole('checkbox', { name: 'Select Sara' })).toBeChecked();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Harness />);
    await expectNoA11yViolations(container);
  });
});

describe('getSelectLabel', () => {
  function Probe({ getRowLabel }: { getRowLabel?: (row: Item) => string }) {
    const table = useReactTable({
      data: items,
      columns: [{ accessorKey: 'name' }],
      getRowId: (item) => item.id,
      getCoreRowModel: getCoreRowModel(),
    });
    return (
      <ul>
        {table.getRowModel().rows.map((row) => (
          <li key={row.id}>{getSelectLabel(row, labels, getRowLabel)}</li>
        ))}
      </ul>
    );
  }

  it('numbers rows from one, or uses the row label', () => {
    const { unmount } = render(<Probe />);
    expect(screen.getAllByRole('listitem').map((node) => node.textContent)).toEqual([
      'Select row 1',
      'Select row 2',
    ]);
    unmount();
    render(<Probe getRowLabel={(item) => item.name} />);
    expect(screen.getAllByRole('listitem').map((node) => node.textContent)).toEqual([
      'Select Ali',
      'Select Sara',
    ]);
  });
});

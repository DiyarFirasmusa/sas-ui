import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from '@tanstack/react-table';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DataTableBulkBar, DataTableColumnMenu } from '@/components/ui/data-table-toolbar';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

interface Item {
  id: string;
  name: string;
  total: number;
}

const columns: ColumnDef<Item>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'total', header: 'Total' },
  { id: 'custom', header: () => 'Custom', meta: { label: 'Custom column' } },
  { id: 'locked', header: 'Locked', enableHiding: false },
];

function Menu({ onVisibility }: { onVisibility?: (state: VisibilityState) => void }) {
  const [visibility, setVisibility] = useState<VisibilityState>({});
  const table = useReactTable({
    data: [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility: visibility },
    onColumnVisibilityChange: (updater) => {
      const next = typeof updater === 'function' ? updater(visibility) : updater;
      setVisibility(next);
      onVisibility?.(next);
    },
  });
  return (
    <>
      <DataTableColumnMenu table={table} />
      <output>
        {table
          .getVisibleLeafColumns()
          .map((column) => column.id)
          .join(',')}
      </output>
    </>
  );
}

describe('DataTableColumnMenu', () => {
  it('lists hideable columns with checkboxes and toggles them', async () => {
    const onVisibility = vi.fn();
    render(<Menu onVisibility={onVisibility} />);
    await userEvent.click(screen.getByRole('button', { name: /Columns/ }));
    const items = await screen.findAllByRole('menuitemcheckbox');
    expect(items.map((item) => item.textContent)).toEqual(['Name', 'Total', 'Custom column']);
    expect(items[0]).toBeChecked();
    await userEvent.click(items[1] as HTMLElement);
    expect(onVisibility).toHaveBeenCalledWith({ total: false });
    expect(screen.getByRole('status')).toHaveTextContent('name,custom,locked');
    expect(items[1]).not.toBeChecked();
  });

  it('is labelled in Arabic', () => {
    renderWithLocale(<Menu />, { locale: 'ar' });
    expect(screen.getByRole('button', { name: /الأعمدة/ })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Menu />);
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: /Columns/ }));
    await screen.findByRole('menu');
    await expectNoA11yViolations();
  });
});

describe('DataTableBulkBar', () => {
  it('shows the count, the actions and a clear button', async () => {
    const onClear = vi.fn();
    render(
      <DataTableBulkBar count={1234} onClear={onClear}>
        <button type="button">Archive</button>
      </DataTableBulkBar>,
    );
    const bar = screen.getByRole('toolbar', { name: 'Bulk actions' });
    expect(within(bar).getByText('1,234 selected on this page')).toBeInTheDocument();
    expect(within(bar).getByRole('button', { name: 'Archive' })).toBeInTheDocument();
    await userEvent.click(within(bar).getByRole('button', { name: 'Clear selection' }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('localises to Arabic with Latin digits', () => {
    renderWithLocale(<DataTableBulkBar count={3} onClear={() => {}} />, {
      locale: 'ar',
    });
    expect(screen.getByRole('toolbar', { name: 'إجراءات جماعية' })).toBeInTheDocument();
    expect(screen.getByText('تم تحديد 3 في هذه الصفحة')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'إلغاء التحديد' })).toBeInTheDocument();
  });

  it('accepts label overrides', () => {
    render(
      <DataTableBulkBar count={2} onClear={() => {}} labels={{ clearSelection: 'Deselect' }} />,
    );
    expect(screen.getByRole('button', { name: 'Deselect' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <DataTableBulkBar count={2} onClear={() => {}}>
        <button type="button">Archive</button>
      </DataTableBulkBar>,
    );
    await expectNoA11yViolations(container);
  });
});

import type { ColumnDef } from '@tanstack/react-table';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, type DataTableProps } from '@/components/ui/data-table';
import { DataTableGroupRow, defaultGroupLabel } from '@/components/ui/data-table-group-row';
import { Table, TableBody } from '@/components/ui/table';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

interface Booking {
  id: string;
  customer: string;
  status: string;
  total: number;
}

const bookings: Booking[] = [
  { id: 'b1', customer: 'Ali', status: 'confirmed', total: 100 },
  { id: 'b2', customer: 'Sara', status: 'pending', total: 50 },
  { id: 'b3', customer: 'Omar', status: 'confirmed', total: 70 },
  { id: 'b4', customer: 'Lina', status: 'pending', total: 30 },
  { id: 'b5', customer: 'Nour', status: 'cancelled', total: 20 },
];

const columns: ColumnDef<Booking>[] = [
  { accessorKey: 'customer', header: 'Customer' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'total', header: 'Total', meta: { numeric: true } },
];

function setup(props: Partial<DataTableProps<Booking>> = {}, locale: 'en' | 'ar' = 'en') {
  return renderWithLocale(
    <DataTable
      columns={columns}
      data={bookings}
      getRowId={(booking) => booking.id}
      state={{ status: 'success' }}
      caption="Bookings"
      groupBy="status"
      {...props}
    />,
    { locale },
  );
}

function toggles(): HTMLElement[] {
  return screen
    .getAllByRole('button', { expanded: true })
    .concat(screen.queryAllByRole('button', { expanded: false }));
}

describe('defaultGroupLabel', () => {
  it('reads values as text and falls back for empty ones', () => {
    expect(defaultGroupLabel('open', 'None')).toBe('open');
    expect(defaultGroupLabel(7, 'None')).toBe('7');
    expect(defaultGroupLabel(null, 'None')).toBe('None');
    expect(defaultGroupLabel('', 'None')).toBe('None');
    expect(defaultGroupLabel(new Date('2025-03-01T10:00:00Z'), 'None')).toBe('2025-03-01');
    expect(defaultGroupLabel(new Date('x'), 'None')).toBe('None');
    expect(defaultGroupLabel({ a: 1 }, 'None')).toBe('{"a":1}');
  });
});

describe('DataTableGroupRow', () => {
  function renderRow(
    props: Partial<Parameters<typeof DataTableGroupRow>[0]> = {},
    locale: 'en' | 'ar' = 'en',
  ) {
    const onToggle = vi.fn();
    const view = renderWithLocale(
      <Table aria-label="Groups">
        <TableBody>
          <DataTableGroupRow
            columnCount={3}
            value="confirmed"
            count={12}
            expanded
            onToggle={onToggle}
            {...props}
          />
        </TableBody>
      </Table>,
      { locale },
    );
    return { onToggle, ...view };
  }

  it('shows the name, count and an expanded toggle that spans the table', async () => {
    const { onToggle } = renderRow({ aggregates: <span>Total 220</span> });
    const toggle = screen.getByRole('button', { name: /confirmed 12 rows/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('cell')).toHaveAttribute('colspan', '3');
    expect(screen.getByText('Total 220')).toBeInTheDocument();
    await userEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('toggles with Enter and Space', async () => {
    const user = userEvent.setup();
    const { onToggle } = renderRow({ expanded: false });
    const toggle = screen.getByRole('button', { name: /confirmed/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    act(() => toggle.focus());
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('writes the count with Latin digits and Arabic labels in Arabic', () => {
    renderRow({ count: 1234, value: 'مؤكد' }, 'ar');
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('صفوف')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /مؤكد/ })).toBeInTheDocument();
  });

  it('names an empty value with the localised fallback and honours a custom label', () => {
    renderRow({ value: undefined }, 'ar');
    expect(screen.getByRole('button', { name: /بدون قيمة/ })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderRow();
    await expectNoA11yViolations(container);
  });
});

describe('DataTable groupBy', () => {
  it('shows a header per group in first-seen order, each followed by its rows', () => {
    setup();
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(8);
    expect(within(rows[0] as HTMLElement).getByRole('button')).toHaveAccessibleName(
      /confirmed 2 rows/,
    );
    expect(within(rows[1] as HTMLElement).getByRole('cell', { name: 'Ali' })).toBeInTheDocument();
    expect(within(rows[2] as HTMLElement).getByRole('cell', { name: 'Omar' })).toBeInTheDocument();
    expect(within(rows[3] as HTMLElement).getByRole('button')).toHaveAccessibleName(
      /pending 2 rows/,
    );
    expect(within(rows[6] as HTMLElement).getByRole('button')).toHaveAccessibleName(
      /cancelled 1 rows/,
    );
    expect(toggles().every((toggle) => toggle.getAttribute('aria-expanded') === 'true')).toBe(true);
  });

  it('collapses and expands a group with the mouse and the keyboard', async () => {
    const user = userEvent.setup();
    setup();
    const confirmed = screen.getByRole('button', { name: /confirmed/ });
    await user.click(confirmed);
    expect(confirmed).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('cell', { name: 'Ali' })).not.toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Sara' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmed 2 rows/ })).toBeInTheDocument();

    act(() => confirmed.focus());
    await user.keyboard('{Enter}');
    expect(confirmed).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('cell', { name: 'Ali' })).toBeInTheDocument();
    await user.keyboard(' ');
    expect(confirmed).toHaveAttribute('aria-expanded', 'false');
  });

  it('passes the group to groupAggregates and renderGroupLabel', () => {
    const groupAggregates = vi.fn(({ rows }: { rows: Booking[] }) => (
      <span>Sum {rows.reduce((sum, row) => sum + row.total, 0)}</span>
    ));
    setup({
      groupAggregates,
      renderGroupLabel: (value) => <strong>{`Status ${String(value)}`}</strong>,
    });
    expect(screen.getByText('Sum 170')).toBeInTheDocument();
    expect(screen.getByText('Sum 80')).toBeInTheDocument();
    expect(screen.getByText('Status pending')).toBeInTheDocument();
    expect(groupAggregates).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'cancelled', value: 'cancelled', rows: [bookings[4]] }),
    );
  });

  it('keeps selection working inside groups', async () => {
    const onRowSelectionChange = vi.fn();
    setup({ selectable: true, onRowSelectionChange });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row 3' }));
    expect(onRowSelectionChange).toHaveBeenCalledWith({ b3: true });
  });

  it('puts rows without a value in a group of their own', () => {
    setup({ data: [...bookings, { id: 'b6', customer: 'Zed', status: '', total: 1 }] });
    expect(screen.getByRole('button', { name: /No value 1 rows/ })).toBeInTheDocument();
  });

  it('leaves the table flat without groupBy', () => {
    setup({ groupBy: undefined });
    expect(screen.queryAllByRole('button', { expanded: true })).toHaveLength(0);
    expect(screen.getAllByRole('row')).toHaveLength(6);
  });

  it('counts groups as rows when virtualised and in keyboard navigation', async () => {
    const user = userEvent.setup();
    // jsdom has no layout: give the scroll area a size so the virtualiser renders rows.
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(400);
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(800);
    setup({ virtualize: { rowHeight: 40 }, keyboardNavigation: true });
    // header + 3 group rows + 5 data rows
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '9');
    const first = document.querySelector<HTMLElement>('[data-grid-row="0"]');
    expect(first).toHaveAttribute('colspan', '3');
    act(() => first?.focus());
    // Enter on a group cell toggles it instead of entering its button.
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: /confirmed/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toHaveAttribute('data-grid-row', '1');
    expect(document.activeElement).toHaveTextContent(/pending/);
    await user.keyboard('{ArrowDown}{ArrowRight}');
    expect(document.activeElement).toHaveAttribute('data-grid-row', '2');
    expect(document.activeElement).toHaveAttribute('data-grid-col', '1');
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowLeft}');
    expect(document.activeElement).toHaveAttribute('data-grid-row', '0');
  });

  it('shows Latin digits for large counts in Arabic', () => {
    const many = Array.from({ length: 1200 }, (_, index) => ({
      id: `m${index}`,
      customer: `عميل ${index}`,
      status: 'مؤكد',
      total: index,
    }));
    setup({ data: many }, 'ar');
    expect(screen.getByText('1,200')).toBeInTheDocument();
  });

  it('has no axe violations in English and Arabic', async () => {
    const { container, unmount } = setup({ selectable: true });
    await expectNoA11yViolations(container);
    unmount();
    const arabic = setup({ keyboardNavigation: true }, 'ar');
    await expectNoA11yViolations(arabic.container);
  });
});

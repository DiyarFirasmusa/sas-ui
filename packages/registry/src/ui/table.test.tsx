import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function Example({ stickyHeader = false }: { stickyHeader?: boolean }) {
  return (
    <Table stickyHeader={stickyHeader}>
      <TableCaption>Invoices</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead sticky="start">Name</TableHead>
          <TableHead numeric>Amount</TableHead>
          <TableHead align="center">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow selected>
          <TableCell sticky="start">Hotel booking</TableCell>
          <TableCell numeric>1,200</TableCell>
          <TableCell align="center">Paid</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Flights</TableCell>
          <TableCell numeric>450</TableCell>
          <TableCell align="end">Due</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell numeric>1,650</TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  );
}

describe('Table', () => {
  it('renders a semantic table with caption, column headers and cells', () => {
    render(<Example />);
    const table = screen.getByRole('table', { name: 'Invoices' });
    expect(table.tagName).toBe('TABLE');
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    expect(screen.getAllByRole('columnheader')[0]).toHaveAttribute('scope', 'col');
    expect(screen.getByRole('cell', { name: 'Hotel booking' })).toBeInTheDocument();
  });

  it('scrolls inside its own focusable container', () => {
    render(<Example />);
    const container = screen.getByRole('table').parentElement;
    expect(container).toHaveAttribute('data-slot', 'table-container');
    expect(container).toHaveClass('overflow-auto');
    expect(container).toHaveAttribute('tabindex', '0');
  });

  it('end-aligns numeric cells with tabular numbers', () => {
    render(<Example />);
    const cell = screen.getByRole('cell', { name: '1,200' });
    expect(cell).toHaveClass('text-end', 'tabular-nums');
    expect(screen.getByRole('columnheader', { name: 'Amount' })).toHaveClass(
      'text-end',
      'tabular-nums',
    );
  });

  it('uses logical alignment and sticky classes only', () => {
    render(<Example />);
    expect(screen.getByRole('cell', { name: 'Paid' })).toHaveClass('text-center');
    expect(screen.getByRole('cell', { name: 'Due' })).toHaveClass('text-end');
    expect(screen.getByRole('cell', { name: 'Hotel booking' })).toHaveClass('sticky', 'start-0');
  });

  it('marks selected rows and flags the sticky header option', () => {
    render(<Example stickyHeader />);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveAttribute('data-state', 'selected');
    expect(rows[2]).not.toHaveAttribute('data-state');
    expect(screen.getByRole('table')).toHaveAttribute('data-sticky-header');
  });

  it('does not flag the sticky header by default', () => {
    render(<Example />);
    expect(screen.getByRole('table')).not.toHaveAttribute('data-sticky-header');
  });

  it('exposes the scroll container: ref, inline style and an optional tab stop', () => {
    const ref = createRef<HTMLDivElement>();
    const { rerender } = render(
      <Table containerRef={ref} containerStyle={{ height: 240 }}>
        <TableBody>
          <TableRow>
            <TableCell>One</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(ref.current).toBe(document.querySelector('[data-slot="table-container"]'));
    expect(ref.current).toHaveStyle({ height: '240px' });
    expect(ref.current).toHaveAttribute('tabindex', '0');
    rerender(
      <Table containerRef={ref} containerFocusable={false}>
        <TableBody>
          <TableRow>
            <TableCell>One</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(ref.current).not.toHaveAttribute('tabindex');
  });

  it('containerLabel turns the focusable container into a named region', async () => {
    const { container, rerender } = render(
      <Table containerLabel="Scrollable invoices">
        <TableBody>
          <TableRow>
            <TableCell>One</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const region = screen.getByRole('region', { name: 'Scrollable invoices' });
    expect(region).toBe(container.querySelector('[data-slot="table-container"]'));
    expect(region).toHaveAttribute('tabindex', '0');
    await expectNoA11yViolations(container);
    rerender(
      <Table containerLabel="Scrollable invoices" containerFocusable={false}>
        <TableBody>
          <TableRow>
            <TableCell>One</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('adds no region role without containerLabel (unchanged default)', () => {
    render(<Example />);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('renders in Arabic without changes to the structure', () => {
    renderWithLocale(<Example />, { locale: 'ar' });
    expect(screen.getByRole('table', { name: 'Invoices' })).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Example stickyHeader />);
    await expectNoA11yViolations(container);
  });
});

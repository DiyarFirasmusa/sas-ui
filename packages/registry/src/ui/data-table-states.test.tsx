import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  DataTableEmptyPanel,
  DataTableErrorPanel,
  DataTableSkeletonCards,
  DataTableSkeletonRows,
  DataTableStateRow,
} from '@/components/ui/data-table-states';
import { Table, TableBody } from '@/components/ui/table';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('DataTableErrorPanel', () => {
  it('announces the error and retries', async () => {
    const onRetry = vi.fn();
    render(<DataTableErrorPanel message="Server returned 500" onRetry={onRetry} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Could not load the data');
    expect(alert).toHaveTextContent('Server returned 500');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows no retry button without a handler', () => {
    render(<DataTableErrorPanel />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('localises to Arabic and accepts overrides', () => {
    const { unmount } = renderWithLocale(<DataTableErrorPanel onRetry={() => {}} />, {
      locale: 'ar',
    });
    expect(screen.getByText('تعذر تحميل البيانات')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'إعادة المحاولة' })).toBeInTheDocument();
    unmount();
    render(
      <DataTableErrorPanel
        onRetry={() => {}}
        labels={{ retry: 'Try again', errorTitle: 'Oops' }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByText('Oops')).toBeInTheDocument();
  });
});

describe('DataTableEmptyPanel', () => {
  it('shows custom text and an action', () => {
    render(
      <DataTableEmptyPanel
        title="No invoices"
        description="Create the first one"
        action={<button type="button">Create invoice</button>}
      />,
    );
    expect(screen.getByText('No invoices')).toBeInTheDocument();
    expect(screen.getByText('Create the first one')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create invoice' })).toBeInTheDocument();
  });

  it('has a default title in both languages', () => {
    const { unmount } = render(<DataTableEmptyPanel />);
    expect(screen.getByText('No results')).toBeInTheDocument();
    unmount();
    renderWithLocale(<DataTableEmptyPanel />, { locale: 'ar' });
    expect(screen.getByText('لا توجد نتائج')).toBeInTheDocument();
  });
});

describe('table body states', () => {
  it('renders skeleton rows with the real column count, hidden from assistive tech', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <DataTableSkeletonRows columnCount={4} rowCount={3} />
        </TableBody>
      </Table>,
    );
    const rows = container.querySelectorAll('[data-slot="data-table-skeleton-row"]');
    expect(rows).toHaveLength(3);
    expect(rows[0]?.querySelectorAll('td')).toHaveLength(4);
    expect(rows[0]).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders a state inside one full-width row', () => {
    render(
      <Table>
        <TableBody>
          <DataTableStateRow columnCount={5}>
            <DataTableEmptyPanel />
          </DataTableStateRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('cell')).toHaveAttribute('colspan', '5');
  });

  it('renders skeleton cards', () => {
    const { container } = render(
      <ul>
        <DataTableSkeletonCards rowCount={2} />
      </ul>,
    );
    expect(container.querySelectorAll('[data-slot="data-table-skeleton-card"]')).toHaveLength(2);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <Table>
          <TableBody>
            <DataTableSkeletonRows columnCount={2} rowCount={2} />
            <DataTableStateRow columnCount={2}>
              <DataTableErrorPanel onRetry={() => {}} />
            </DataTableStateRow>
          </TableBody>
        </Table>
        <DataTableEmptyPanel title="Nothing" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

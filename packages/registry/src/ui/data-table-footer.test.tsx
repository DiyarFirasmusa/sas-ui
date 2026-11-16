import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTableFooter } from '@/components/ui/data-table-footer';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const base = { page: 2, pageSize: 10, total: 45, onPageChange: () => {} };

describe('DataTableFooter', () => {
  it('shows the range and runs onBeforeChange before the page callback', async () => {
    const calls: string[] = [];
    renderWithLocale(
      <DataTableFooter
        pagination={{ ...base, onPageChange: () => calls.push('page') }}
        onBeforeChange={() => calls.push('before')}
      />,
    );
    expect(screen.getByText('Showing 11–20 of 45')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(calls).toEqual(['before', 'page']);
  });

  it('offers the page-size select only with onPageSizeChange', async () => {
    const onPageSizeChange = vi.fn();
    const { rerender } = renderWithLocale(<DataTableFooter pagination={base} />);
    expect(screen.queryByRole('combobox', { name: 'Rows per page' })).not.toBeInTheDocument();
    rerender(<DataTableFooter pagination={{ ...base, onPageSizeChange }} />);
    expect(screen.getByRole('combobox', { name: 'Rows per page' })).toBeInTheDocument();
  });

  it('locks the controls while disabled', () => {
    renderWithLocale(<DataTableFooter pagination={base} disabled />);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('labels the navigation in Arabic and has no axe violations', async () => {
    const { container } = renderWithLocale(<DataTableFooter pagination={base} />, {
      locale: 'ar',
    });
    expect(screen.getByRole('navigation', { name: 'ترقيم الصفحات' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});

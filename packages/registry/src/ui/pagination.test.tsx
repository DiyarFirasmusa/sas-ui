import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from '@/components/ui/pagination';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('Pagination', () => {
  it('is a labelled nav landmark with the current page marked', () => {
    render(<Pagination page={3} pageCount={10} onPageChange={() => {}} />);
    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(within(nav).getByRole('button', { name: 'Page 3' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('button', { name: 'Page 2' })).not.toHaveAttribute('aria-current');
  });

  it('reports the page the user picks', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} pageCount={10} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    await userEvent.click(screen.getByRole('button', { name: 'First page' }));
    await userEvent.click(screen.getByRole('button', { name: 'Last page' }));
    await userEvent.click(screen.getByRole('button', { name: 'Page 5' }));
    expect(onPageChange.mock.calls.map(([value]) => value)).toEqual([4, 2, 1, 10, 5]);
  });

  it('does not report the current page again', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} pageCount={10} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('disables back controls on the first page and forward controls on the last', () => {
    const { rerender } = render(<Pagination page={1} pageCount={4} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
    rerender(<Pagination page={4} pageCount={4} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Last page' })).toBeDisabled();
  });

  it('windows long page lists with ellipses', () => {
    render(<Pagination page={10} pageCount={20} onPageChange={() => {}} />);
    const nav = screen.getByRole('navigation');
    const pages = within(nav)
      .getAllByRole('button', { name: /^Page \d+$/ })
      .map((button) => button.textContent);
    expect(pages).toEqual(['1', '9', '10', '11', '20']);
    expect(nav.querySelectorAll('li[aria-hidden="true"]')).toHaveLength(2);
  });

  it('derives the page count and the "showing" text from total and page size', () => {
    render(<Pagination page={2} total={1234} pageSize={50} onPageChange={() => {}} />);
    expect(screen.getByText('Showing 51–100 of 1,234')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 25' })).toBeInTheDocument();
  });

  it('clips the last page range to the total', () => {
    render(<Pagination page={3} total={25} pageSize={10} onPageChange={() => {}} />);
    expect(screen.getByText('Showing 21–25 of 25')).toBeInTheDocument();
  });

  it('says there are no results for an empty list', () => {
    render(<Pagination page={1} total={0} pageSize={10} onPageChange={() => {}} />);
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('announces the page in a live region', () => {
    render(<Pagination page={2} pageCount={9} onPageChange={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('Page 2 of 9');
  });

  it('changes the page size from the select', async () => {
    const onPageSizeChange = vi.fn();
    render(
      <Pagination
        page={1}
        total={500}
        pageSize={20}
        onPageChange={() => {}}
        onPageSizeChange={onPageSizeChange}
      />,
    );
    await userEvent.click(screen.getByRole('combobox', { name: 'Rows per page' }));
    await userEvent.click(await screen.findByRole('option', { name: '50' }));
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it('includes a custom page size in the options', async () => {
    render(
      <Pagination
        page={1}
        total={500}
        pageSize={25}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole('combobox', { name: 'Rows per page' }));
    expect(await screen.findByRole('option', { name: '25' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });

  it('ignores every control while disabled', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} pageCount={10} onPageChange={onPageChange} disabled />);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Page 5' }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('is keyboard operable', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} pageCount={10} onPageChange={onPageChange} />);
    screen.getByRole('button', { name: 'Next page' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('accepts label overrides', () => {
    render(
      <Pagination
        page={1}
        pageCount={3}
        onPageChange={() => {}}
        labels={{ navigation: 'Invoices pages' }}
      />,
    );
    expect(screen.getByRole('navigation', { name: 'Invoices pages' })).toBeInTheDocument();
  });

  it('localises labels to Arabic and keeps Latin digits', () => {
    renderWithLocale(<Pagination page={2} total={1234} pageSize={10} onPageChange={() => {}} />, {
      locale: 'ar',
    });
    expect(screen.getByRole('navigation', { name: 'ترقيم الصفحات' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'الصفحة التالية' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'الصفحة 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByText('عرض 11–20 من 1,234')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('الصفحة 2 من 124');
  });

  it('mirrors the chevrons in RTL through the icon classes', () => {
    renderWithLocale(<Pagination page={2} pageCount={5} onPageChange={() => {}} />, {
      locale: 'ar',
    });
    const icon = screen.getByRole('button', { name: 'الصفحة التالية' }).querySelector('svg');
    expect(icon).toHaveClass('rtl:-scale-x-100');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Pagination
        page={2}
        total={300}
        pageSize={20}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />,
    );
    await expectNoA11yViolations(container);
  });
});

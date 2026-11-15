import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PageHeader } from '@/components/ui/page-header';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('PageHeader', () => {
  it('renders the title as the page heading with subtitle, badge, breadcrumb and actions', () => {
    render(
      <PageHeader
        title="Invoices"
        subtitle="All billing documents"
        badge={<span>Draft</span>}
        breadcrumb={<nav aria-label="Breadcrumb">Home / Invoices</nav>}
        actions={<button type="button">New</button>}
      />,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Invoices' })).toBeInTheDocument();
    expect(screen.getByText('All billing documents')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
  });

  it('has no back control by default', () => {
    render(<PageHeader title="Invoices" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('goes back through a button', async () => {
    const onBack = vi.fn();
    render(<PageHeader title="Invoice 12" onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('goes back through a link, and onBack wins over backHref', () => {
    const { rerender } = render(
      <PageHeader title="Invoice 12" backHref="/invoices" backLabel="All invoices" />,
    );
    expect(screen.getByRole('link', { name: 'All invoices' })).toHaveAttribute('href', '/invoices');
    rerender(<PageHeader title="Invoice 12" backHref="/invoices" onBack={() => {}} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });

  it('mirrors the back arrow in RTL and labels it in Arabic', () => {
    const { container } = renderWithLocale(<PageHeader title="الفواتير" onBack={() => {}} />, {
      locale: 'ar',
    });
    expect(screen.getByRole('button', { name: 'رجوع' })).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveClass('rtl:-scale-x-100');
  });

  it('can stick to the top', () => {
    const { container } = render(<PageHeader title="Invoices" sticky />);
    expect(container.firstElementChild).toHaveClass('sticky', 'top-0');
    expect(container.firstElementChild).toHaveAttribute('data-sticky');
  });

  it('is not sticky by default', () => {
    const { container } = render(<PageHeader title="Invoices" />);
    expect(container.firstElementChild).not.toHaveClass('sticky');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <PageHeader
        title="Invoices"
        subtitle="All"
        onBack={() => {}}
        actions={<button type="button">New</button>}
      />,
    );
    await expectNoA11yViolations(container);
  });
});

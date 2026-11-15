import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from '@/components/ui/empty-state';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('EmptyState', () => {
  it('shows the localized default title with an icon', () => {
    const { container } = render(<EmptyState />);
    expect(screen.getByRole('heading', { name: 'Nothing here yet' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="empty-state-icon"] svg')).toBeInTheDocument();
  });

  it('shows custom title, description and actions', () => {
    render(
      <EmptyState
        title="No invoices"
        description="Create your first invoice."
        actions={<button type="button">New invoice</button>}
      />,
    );
    expect(screen.getByRole('heading', { name: 'No invoices' })).toBeInTheDocument();
    expect(screen.getByText('Create your first invoice.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New invoice' })).toBeInTheDocument();
  });

  it('has a no-results preset', () => {
    render(<EmptyState preset="no-results" />);
    expect(screen.getByRole('heading', { name: 'No results found' })).toBeInTheDocument();
    expect(screen.getByText('Try a different search or clear the filters.')).toBeInTheDocument();
  });

  it('supports the page size, a custom heading level and no icon', () => {
    const { container } = render(<EmptyState size="page" titleAs="h1" icon={null} />);
    expect(container.firstElementChild).toHaveClass('min-h-80');
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="empty-state-icon"]')).toBeNull();
  });

  it('is not an alert: empty is not an error', () => {
    render(<EmptyState />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('uses Arabic defaults', () => {
    renderWithLocale(<EmptyState preset="no-results" />, { locale: 'ar' });
    expect(screen.getByRole('heading', { name: 'لا توجد نتائج' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <EmptyState description="Nothing to show." actions={<button type="button">Add</button>} />,
    );
    await expectNoA11yViolations(container);
  });
});

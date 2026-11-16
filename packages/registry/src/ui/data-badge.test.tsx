import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataBadge, type DataBadgeStatus } from '@/components/ui/data-badge';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const statusMap: Record<string, DataBadgeStatus> = {
  PAID: { tone: 'green', label: 'Paid' },
  OVERDUE: { tone: 'red', label: 'Overdue' },
  '2': { tone: 'blue', label: 'In review' },
};

describe('DataBadge', () => {
  it('maps a backend value to its tone and label', () => {
    render(<DataBadge value="PAID" statusMap={statusMap} />);
    expect(screen.getByText('Paid')).toHaveClass('text-tag-green');
  });

  it('shows a status dot without a container by default and a tinted chip with dot={false}', () => {
    const { container, rerender } = render(<DataBadge value="PAID" statusMap={statusMap} />);
    const badge = screen.getByText('Paid');
    expect(badge).toHaveClass('bg-transparent', 'h-[22px]');
    expect(container.querySelector('[data-slot="badge-dot"]')).toBeInTheDocument();
    rerender(<DataBadge value="PAID" statusMap={statusMap} dot={false} />);
    expect(screen.getByText('Paid')).toHaveClass('bg-tag-green-container');
    expect(container.querySelector('[data-slot="badge-dot"]')).not.toBeInTheDocument();
  });

  it('resolves numeric values through their string key', () => {
    render(<DataBadge value={2} statusMap={statusMap} />);
    expect(screen.getByText('In review')).toHaveClass('text-tag-blue');
  });

  it('falls back to a neutral badge with the raw value', () => {
    render(<DataBadge value="ARCHIVED" statusMap={statusMap} />);
    expect(screen.getByText('ARCHIVED')).toHaveClass('text-text-secondary');
  });

  it('does not resolve inherited object keys', () => {
    render(<DataBadge value="constructor" statusMap={statusMap} />);
    expect(screen.getByText('constructor')).toHaveClass('text-text-secondary');
  });

  it.each([null, undefined, ''] as const)('shows the empty label for %j', (value) => {
    render(<DataBadge value={value} statusMap={statusMap} emptyLabel="None" />);
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('renders Arabic labels from the map', () => {
    renderWithLocale(
      <DataBadge value="PAID" statusMap={{ PAID: { tone: 'green', label: 'مدفوع' } }} />,
      { locale: 'ar' },
    );
    expect(screen.getByText('مدفوع')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<DataBadge value="OVERDUE" statusMap={statusMap} />);
    await expectNoA11yViolations(container);
  });
});

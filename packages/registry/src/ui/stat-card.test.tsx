import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UserIcon } from '@/components/ui/icons';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('StatCard', () => {
  it('shows the label and a left-to-right figure', () => {
    render(<StatCard label="Revenue" value="12,480" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    const figure = screen.getByText('12,480');
    expect(figure).toHaveAttribute('dir', 'ltr');
    expect(figure.parentElement).toHaveClass('tabular-nums');
  });

  it('accepts numbers and zero', () => {
    render(<StatCard label="Open" value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('shows the empty value when there is none', () => {
    render(<StatCard label="Open" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders an up delta in the success tone with spoken direction', () => {
    render(
      <StatCard
        label="Revenue"
        value="1"
        delta={{ value: '12%', trend: 'up', caption: 'vs last month' }}
      />,
    );
    const delta = screen.getByText('12%').closest('[data-slot="stat-card-delta"]');
    expect(delta).toHaveAttribute('data-tone', 'positive');
    expect(delta).toHaveClass('text-success');
    expect(delta).toHaveTextContent('Increase of12%');
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('renders a down delta in the danger tone, and lets the caller invert it', () => {
    const { rerender } = render(
      <StatCard label="Costs" value="1" delta={{ value: '5%', trend: 'down' }} />,
    );
    expect(screen.getByText('5%').closest('[data-slot="stat-card-delta"]')).toHaveClass(
      'text-danger',
    );
    rerender(
      <StatCard label="Costs" value="1" delta={{ value: '5%', trend: 'down', tone: 'positive' }} />,
    );
    expect(screen.getByText('5%').closest('[data-slot="stat-card-delta"]')).toHaveClass(
      'text-success',
    );
  });

  it('renders a neutral delta without an arrow', () => {
    const { container } = render(
      <StatCard label="Flat" value="1" delta={{ value: '0%', trend: 'neutral' }} />,
    );
    expect(container.querySelector('[data-slot="stat-card-delta"] svg')).toBeNull();
  });

  it('shows the icon tile', () => {
    const { container } = render(
      <StatCard label="Users" value="9" icon={<UserIcon />} tone="success" />,
    );
    expect(container.querySelector('[data-slot="stat-card-icon"]')).toHaveClass(
      'bg-tag-green-container',
    );
  });

  it('shows skeletons and marks itself busy while loading', () => {
    const { container } = render(
      <StatCard label="Revenue" value="12,480" delta={{ value: '1%', trend: 'up' }} loading />,
    );
    expect(container.querySelector('[data-slot="stat-card"]')).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(2);
    expect(screen.queryByText('12,480')).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('is a plain container without href or onClick', () => {
    render(<StatCard label="Revenue" value="1" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('becomes a link with href', () => {
    render(<StatCard label="Overdue" value="3" href="/invoices?status=overdue" />);
    expect(screen.getByRole('link', { name: /Overdue/ })).toHaveAttribute(
      'href',
      '/invoices?status=overdue',
    );
  });

  it('becomes a keyboard-operable button with onClick', async () => {
    const onClick = vi.fn();
    render(<StatCard label="Overdue" value="3" onClick={onClick} />);
    const button = screen.getByRole('button', { name: /Overdue/ });
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('speaks the delta direction in Arabic', () => {
    renderWithLocale(
      <StatCard label="الإيرادات" value="١٢" delta={{ value: '12%', trend: 'down' }} />,
      {
        locale: 'ar',
      },
    );
    expect(screen.getByText('انخفاض بنسبة')).toBeInTheDocument();
    expect(screen.getByText('12%')).toHaveAttribute('dir', 'ltr');
  });

  it('has no axe violations in any mode', async () => {
    const { container } = render(
      <StatGrid>
        <StatCard
          label="Revenue"
          value="12"
          delta={{ value: '1%', trend: 'up' }}
          icon={<UserIcon />}
        />
        <StatCard label="Loading" loading />
        <StatCard label="Link" value="1" href="/x" />
        <StatCard label="Button" value="1" onClick={() => {}} />
      </StatGrid>,
    );
    await expectNoA11yViolations(container);
  });
});

describe('StatGrid', () => {
  it('lays out cards responsively', () => {
    const { container } = render(<StatGrid columns={3}>{null}</StatGrid>);
    expect(container.firstElementChild).toHaveClass('grid', 'lg:grid-cols-3');
  });

  it('defaults to four columns on wide screens', () => {
    const { container } = render(<StatGrid>{null}</StatGrid>);
    expect(container.firstElementChild).toHaveClass('xl:grid-cols-4');
  });
});

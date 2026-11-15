import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Alert } from '@/components/ui/alert';
import { renderWithLocale } from '@/test/render';
import { expectNoA11yViolations } from '@/test/a11y';

describe('Alert', () => {
  it('renders the title and description', () => {
    render(<Alert title="Saved" description="Your changes are live." variant="success" />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Your changes are live.')).toBeInTheDocument();
  });

  it.each(['danger', 'warning'] as const)('announces %s immediately with role=alert', (variant) => {
    render(<Alert variant={variant} title="Heads up" />);
    expect(screen.getByRole('alert')).toHaveAttribute('data-variant', variant);
  });

  it.each(['info', 'success'] as const)('announces %s politely with role=status', (variant) => {
    render(<Alert variant={variant} title="FYI" />);
    expect(screen.getByRole('status')).toHaveAttribute('data-variant', variant);
  });

  it('defaults to info', () => {
    render(<Alert title="FYI" />);
    expect(screen.getByRole('status')).toHaveClass('bg-tag-cyan-container');
  });

  it('shows the action and lets the caller override the icon', () => {
    const { container } = render(
      <Alert title="Offline" action={<button type="button">Retry</button>} icon={null} />,
    );
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="alert-icon"]')).toBeNull();
  });

  it('has no dismiss button unless onDismiss is given', () => {
    render(<Alert title="Static" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('dismisses through a localized button', async () => {
    const onDismiss = vi.fn();
    render(<Alert title="Closable" onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('labels the dismiss button in Arabic and accepts an override', () => {
    const { unmount } = renderWithLocale(<Alert title="تنبيه" onDismiss={() => {}} />, { locale: 'ar' });
    expect(screen.getByRole('button', { name: 'إغلاق التنبيه' })).toBeInTheDocument();
    unmount();
    renderWithLocale(<Alert title="x" onDismiss={() => {}} dismissLabel="Hide" />);
    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <Alert variant="danger" title="Failed" description="Try again." onDismiss={() => {}} />
        <Alert variant="success" title="Done" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

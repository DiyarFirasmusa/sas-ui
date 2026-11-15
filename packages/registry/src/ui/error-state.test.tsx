import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorState } from '@/components/ui/error-state';
import { renderWithLocale } from '@/test/render';
import { expectNoA11yViolations } from '@/test/a11y';

describe('ErrorState', () => {
  it('is announced as an alert with localized default wording', () => {
    render(<ErrorState />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('data-kind', 'error');
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
  });

  it('has no retry button unless onRetry is given', () => {
    render(<ErrorState />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('retries through a localized button', async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('blocks repeat retries while retrying', async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} retrying />);
    const button = screen.getByRole('button', { name: 'Try again' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('has not-found and forbidden presets', () => {
    const { rerender } = render(<ErrorState kind="not-found" />);
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    rerender(<ErrorState kind="forbidden" />);
    expect(screen.getByRole('heading', { name: 'Access denied' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveAttribute('data-kind', 'forbidden');
  });

  it('accepts overrides, details and extra actions in the page size', () => {
    const { container } = render(
      <ErrorState
        size="page"
        title="Sync failed"
        description="The server said no."
        details="HTTP 503"
        retryLabel="Retry sync"
        onRetry={() => {}}
        actions={<a href="/support">Support</a>}
      />,
    );
    expect(container.firstElementChild).toHaveClass('min-h-80');
    expect(screen.getByRole('heading', { name: 'Sync failed' })).toBeInTheDocument();
    expect(screen.getByText('HTTP 503')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry sync' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Support' })).toBeInTheDocument();
  });

  it('uses Arabic wording', () => {
    const { unmount } = renderWithLocale(<ErrorState onRetry={() => {}} />, { locale: 'ar' });
    expect(screen.getByRole('heading', { name: 'حدث خطأ ما' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'إعادة المحاولة' })).toBeInTheDocument();
    unmount();
    renderWithLocale(<ErrorState kind="forbidden" />, { locale: 'ar' });
    expect(screen.getByRole('heading', { name: 'لا تملك صلاحية الوصول' })).toBeInTheDocument();
  });

  it.each(['error', 'not-found', 'forbidden'] as const)('has no axe violations (%s)', async (kind) => {
    const { container } = render(<ErrorState kind={kind} onRetry={() => {}} />);
    await expectNoA11yViolations(container);
  });
});

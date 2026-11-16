import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorPage01, type ErrorPage01Kind } from '@/components/blocks/error-page-01';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('ErrorPage01', () => {
  it.each([
    ['403', '403', 'Access denied'],
    ['404', '404', 'Page not found'],
    ['500', '500', 'Something went wrong'],
    ['maintenance', '503', 'Down for maintenance'],
  ] as const)('shows the %s page with its code and heading', (kind, code, heading) => {
    renderWithLocale(<ErrorPage01 kind={kind} />);
    expect(screen.getByText(code)).toHaveAttribute('dir', 'ltr');
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it('shows the offline page without a status code', () => {
    renderWithLocale(<ErrorPage01 kind="offline" />);
    expect(screen.getByRole('heading', { level: 1, name: 'You are offline' })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="error-code"]')).toBeNull();
  });

  it('defaults to 404 and links home', () => {
    renderWithLocale(<ErrorPage01 homeHref="/dashboard" />);
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });

  it('goes back through the handler or the history', async () => {
    const onBack = vi.fn();
    const { unmount } = renderWithLocale(<ErrorPage01 kind="403" onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(onBack).toHaveBeenCalledOnce();
    unmount();

    const history = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    renderWithLocale(<ErrorPage01 kind="404" />);
    await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(history).toHaveBeenCalledOnce();
    history.mockRestore();
  });

  it.each<ErrorPage01Kind>(['500', 'offline', 'maintenance'])(
    'retries on the %s page and not before a handler exists',
    async (kind) => {
      const { unmount } = renderWithLocale(<ErrorPage01 kind={kind} />);
      expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Go back' })).not.toBeInTheDocument();
      unmount();

      const onRetry = vi.fn();
      renderWithLocale(<ErrorPage01 kind={kind} onRetry={onRetry} />);
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(onRetry).toHaveBeenCalledOnce();
    },
  );

  it('blocks the retry while it is running', async () => {
    const onRetry = vi.fn();
    renderWithLocale(<ErrorPage01 kind="500" onRetry={onRetry} retrying />);
    const retry = screen.getByRole('button', { name: 'Try again' });
    expect(retry).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(retry);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('shows the support link and a left-to-right reference when given', () => {
    renderWithLocale(<ErrorPage01 kind="500" supportHref="/support" reference="req_8f2a91" />);
    expect(screen.getByRole('link', { name: 'Contact support' })).toHaveAttribute(
      'href',
      '/support',
    );
    expect(screen.getByText('req_8f2a91')).toHaveAttribute('dir', 'ltr');
  });

  it('accepts a custom title and description', () => {
    renderWithLocale(
      <ErrorPage01 kind="404" title="No such invoice" description="Check the number." />,
    );
    expect(screen.getByRole('heading', { name: 'No such invoice' })).toBeInTheDocument();
    expect(screen.getByText('Check the number.')).toBeInTheDocument();
  });

  it('renders Arabic wording with Latin digits for the code', () => {
    renderWithLocale(<ErrorPage01 kind="404" />, { locale: 'ar' });
    expect(
      screen.getByRole('heading', { level: 1, name: 'الصفحة غير موجودة' }),
    ).toBeInTheDocument();
    expect(screen.getByText('404')).toHaveAttribute('dir', 'ltr');
    expect(screen.getByRole('link', { name: 'العودة إلى الرئيسية' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'رجوع' })).toBeInTheDocument();
  });

  it('has Arabic wording for offline and maintenance', () => {
    const { unmount } = renderWithLocale(<ErrorPage01 kind="offline" />, { locale: 'ar' });
    expect(screen.getByRole('heading', { name: 'لا يوجد اتصال بالإنترنت' })).toBeInTheDocument();
    unmount();
    renderWithLocale(<ErrorPage01 kind="maintenance" />, { locale: 'ar' });
    expect(screen.getByRole('heading', { name: 'الخدمة متوقفة للصيانة' })).toBeInTheDocument();
  });

  it.each<ErrorPage01Kind>(['403', '404', '500', 'offline', 'maintenance'])(
    'has no axe violations on the %s page',
    async (kind) => {
      const { container } = renderWithLocale(
        <ErrorPage01 kind={kind} onRetry={() => {}} supportHref="/support" reference="req_1" />,
      );
      await expectNoA11yViolations(container);
    },
  );
});

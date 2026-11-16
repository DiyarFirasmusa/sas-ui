import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Login01 } from '@/components/blocks/login-01';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('Login01', () => {
  it('shows required and format errors before submitting', async () => {
    const onSubmit = vi.fn();
    renderWithLocale(<Login01 onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter your email')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/Email/), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid credentials with the remember flag', async () => {
    const onSubmit = vi.fn();
    renderWithLocale(<Login01 onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText(/Email/), 'layla@example.com');
    await userEvent.type(screen.getByLabelText(/Password/), 'secret');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Remember me' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      email: 'layla@example.com',
      password: 'secret',
      remember: true,
    });
  });

  it('is single-flight while the submit is pending', async () => {
    let finish: () => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderWithLocale(<Login01 onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText(/Email/), 'a@b.co');
    await userEvent.type(screen.getByLabelText(/Password/), 'x');
    const button = screen.getByRole('button', { name: 'Sign in' });
    await userEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute('aria-busy', 'true'));
    await userEvent.click(button);
    expect(onSubmit).toHaveBeenCalledOnce();
    finish();
    await waitFor(() => expect(button).not.toHaveAttribute('aria-busy'));
  });

  it('shows the server error', () => {
    renderWithLocale(<Login01 error="Wrong email or password" />);
    expect(screen.getByText('Wrong email or password')).toBeInTheDocument();
  });

  it('renders Arabic labels, RTL-friendly and with a left-to-right email', () => {
    renderWithLocale(<Login01 />, { locale: 'ar' });
    expect(screen.getByRole('heading', { name: 'تسجيل الدخول' })).toBeInTheDocument();
    expect(screen.getByLabelText(/البريد الإلكتروني/)).toHaveAttribute('dir', 'ltr');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(<Login01 brand="SAS Suite" />);
    await expectNoA11yViolations(container);
  });
});

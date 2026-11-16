import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Login02 } from '@/components/blocks/login-02';
import { Button } from '@/components/ui/button';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('Login02', () => {
  it('shows required and format errors before submitting', async () => {
    const onSubmit = vi.fn();
    renderWithLocale(<Login02 onSubmit={onSubmit} />);
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
    renderWithLocale(<Login02 onSubmit={onSubmit} />);
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
    renderWithLocale(<Login02 onSubmit={onSubmit} />);
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

  it('shows the server error and the switcher slot', () => {
    renderWithLocale(
      <Login02
        error="Wrong email or password"
        switcher={
          <Button variant="ghost" size="sm">
            العربية
          </Button>
        }
      />,
    );
    expect(screen.getByText('Wrong email or password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'العربية' })).toBeInTheDocument();
  });

  it('renders the brand panel with the brand name and tagline', () => {
    renderWithLocale(<Login02 brand="Layla Co" tagline="Hello team" />);
    const panel = document.querySelector('[data-slot="login-brand-panel"]');
    expect(panel).toHaveTextContent('Layla Co');
    expect(panel).toHaveTextContent('Hello team');
    expect(panel).toHaveTextContent('L');
  });

  it('renders Arabic labels with a left-to-right email', () => {
    renderWithLocale(<Login02 />, { locale: 'ar' });
    expect(screen.getByRole('heading', { name: 'أهلاً بعودتك' })).toBeInTheDocument();
    expect(screen.getByLabelText(/البريد الإلكتروني/)).toHaveAttribute('dir', 'ltr');
    expect(screen.getByText('كل ما يحتاجه فريقك في مكان واحد.')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(<Login02 brand="SAS Suite" />);
    await expectNoA11yViolations(container);
  });
});

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ShellUserMenu } from '@/components/blocks/shell-user-menu';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const user = { name: 'Layla Hassan', email: 'layla@example.com' };

describe('ShellUserMenu', () => {
  it('opens with profile and sign out, and calls their handlers', async () => {
    const onProfile = vi.fn();
    const onSignOut = vi.fn();
    renderWithLocale(<ShellUserMenu user={user} onProfile={onProfile} onSignOut={onSignOut} />);
    await userEvent.click(screen.getByRole('button', { name: 'Account menu for Layla Hassan' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Profile' }));
    expect(onProfile).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Account menu for Layla Hassan' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('leaves out the sections that have no handler', async () => {
    renderWithLocale(<ShellUserMenu user={user} />);
    await userEvent.click(screen.getByRole('button'));
    await screen.findByRole('menu');
    expect(screen.queryByRole('menuitem', { name: 'Sign out' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Language/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Theme/ })).not.toBeInTheDocument();
  });

  it('changes the language from a submenu', async () => {
    const onLocaleChange = vi.fn();
    renderWithLocale(<ShellUserMenu user={user} onLocaleChange={onLocaleChange} />);
    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Language/ }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'العربية' }));
    expect(onLocaleChange).toHaveBeenCalledWith('ar');
  });

  it('changes the theme from a submenu', async () => {
    const onModeChange = vi.fn();
    renderWithLocale(<ShellUserMenu user={user} mode="light" onModeChange={onModeChange} />);
    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Theme/ }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Dark' }));
    expect(onModeChange).toHaveBeenCalledWith('dark');
  });

  it('shows the name and email in the sidebar variant', () => {
    renderWithLocale(<ShellUserMenu user={user} variant="sidebar" />);
    expect(screen.getByText('Layla Hassan')).toBeInTheDocument();
    expect(screen.getByText('layla@example.com')).toHaveAttribute('dir', 'ltr');
  });

  it('renders Arabic labels', async () => {
    renderWithLocale(<ShellUserMenu user={{ name: 'ليلى حسن' }} onSignOut={() => {}} />, {
      locale: 'ar',
    });
    await userEvent.click(screen.getByRole('button', { name: 'قائمة حساب ليلى حسن' }));
    expect(await screen.findByRole('menuitem', { name: 'تسجيل الخروج' })).toBeInTheDocument();
  });

  it('has no axe violations closed or open', async () => {
    const { container } = renderWithLocale(
      <ShellUserMenu user={user} variant="sidebar" onSignOut={() => {}} />,
    );
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button'));
    await screen.findByRole('menu');
    await expectNoA11yViolations(document.body);
  });
});

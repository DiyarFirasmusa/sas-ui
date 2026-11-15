import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SidebarContext } from '@/components/ui/sidebar';
import { Topbar } from '@/components/ui/topbar';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('Topbar', () => {
  it('renders the title and actions in a banner landmark', () => {
    render(<Topbar title="Dashboard" actions={<button type="button">Account</button>} />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument();
  });

  it('has no menu button outside an app shell', () => {
    render(<Topbar title="Dashboard" />);
    expect(screen.queryByRole('button', { name: 'Open navigation menu' })).not.toBeInTheDocument();
  });

  it('opens the drawer from the menu button inside a shell', async () => {
    const openMobile = vi.fn();
    render(
      <SidebarContext
        value={{
          inShell: true,
          collapsed: false,
          setCollapsed: () => {},
          variant: 'desktop',
          mobileOpen: false,
          openMobile,
          closeMobile: () => {},
        }}
      >
        <Topbar title="Dashboard" />
      </SidebarContext>,
    );
    const menu = screen.getByRole('button', { name: 'Open navigation menu' });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(menu).toHaveClass('md:hidden');
    await userEvent.click(menu);
    expect(openMobile).toHaveBeenCalledOnce();
  });

  it('lets the title be Arabic and uses a localised menu label', () => {
    renderWithLocale(
      <SidebarContext
        value={{
          inShell: true,
          collapsed: false,
          setCollapsed: () => {},
          variant: 'desktop',
          mobileOpen: false,
          openMobile: () => {},
          closeMobile: () => {},
        }}
      >
        <Topbar title="لوحة التحكم" />
      </SidebarContext>,
      { locale: 'ar' },
    );
    expect(screen.getByText('لوحة التحكم')).toHaveAttribute('dir', 'auto');
    expect(screen.getByRole('button', { name: 'فتح قائمة التنقل' })).toBeInTheDocument();
  });

  it('accepts a custom menu label', () => {
    render(
      <SidebarContext
        value={{
          inShell: true,
          collapsed: false,
          setCollapsed: () => {},
          variant: 'desktop',
          mobileOpen: false,
          openMobile: () => {},
          closeMobile: () => {},
        }}
      >
        <Topbar menuLabel="Menu" />
      </SidebarContext>,
    );
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    render(<Topbar title="Dashboard" actions={<button type="button">Account</button>} />);
    await expectNoA11yViolations();
  });
});

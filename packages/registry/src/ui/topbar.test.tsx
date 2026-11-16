import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SidebarContext, type SidebarContextValue } from '@/components/ui/sidebar';
import { Topbar, topbarChip, TopbarContext, useTopbarVariant } from '@/components/ui/topbar';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const shell: SidebarContextValue = {
  inShell: true,
  collapsed: false,
  setCollapsed: () => {},
  variant: 'desktop',
  mobileOpen: false,
  openMobile: () => {},
  closeMobile: () => {},
};

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

  describe('variants', () => {
    it('is the 72px bar in the sidebar colours by default', () => {
      render(<Topbar title="Dashboard" />);
      const bar = screen.getByRole('banner');
      expect(bar).toHaveAttribute('data-variant', 'sidebar');
      expect(bar).toHaveClass(
        'h-18',
        'bg-sidebar',
        'text-sidebar-foreground',
        'border-sidebar-border',
      );
    });

    it('can sit on the page surface like the inventory bar', () => {
      render(<Topbar variant="surface" title="Dashboard" />);
      expect(screen.getByRole('banner')).toHaveClass('h-18', 'bg-surface', 'text-text-primary');
    });

    it('is the 62px blurred bar with a title accent and no phone view in the hr variant', () => {
      render(<Topbar variant="hr" title="Employees" />);
      const bar = screen.getByRole('banner');
      expect(bar).toHaveClass('h-15.5', 'bg-surface/92', 'backdrop-blur-sm', 'max-md:hidden');
      expect(bar.querySelector('span[aria-hidden="true"]')).toHaveClass('from-gold', 'to-primary');
    });

    it('follows the hr layout of the surrounding shell', () => {
      render(
        <SidebarContext value={{ ...shell, layout: 'hr', mobileHeader: true }}>
          <Topbar title="Employees" />
        </SidebarContext>,
      );
      expect(screen.getByRole('banner')).toHaveAttribute('data-variant', 'hr');
    });

    it('has no accent on the compact bars and passes its variant to controls inside', () => {
      function Probe() {
        return <span data-testid="probe">{useTopbarVariant()}</span>;
      }
      render(<Topbar variant="surface" title="Dashboard" actions={<Probe />} />);
      expect(screen.getByRole('banner').querySelector('.bg-linear-to-b')).toBeNull();
      expect(screen.getByTestId('probe')).toHaveTextContent('surface');
    });

    it('lets controls dress to a variant outside a bar through the context', () => {
      render(
        <TopbarContext value="hr">
          <button type="button" className={topbarChip('hr')}>
            x
          </button>
        </TopbarContext>,
      );
      expect(screen.getByRole('button')).toHaveClass('size-9', 'rounded-md', 'border-stroke');
    });

    it('builds the three chip kinds for every variant', () => {
      expect(topbarChip('sidebar', 'icon')).toContain('bg-sidebar-foreground/8');
      expect(topbarChip('surface', 'account')).toContain('bg-primary-light');
      expect(topbarChip('hr', 'account')).toContain('bg-surface-dim');
      expect(topbarChip('sidebar', 'text')).toContain('min-h-11');
    });
  });

  it('hides its menu button when the shell draws a phone header', () => {
    render(
      <SidebarContext value={{ ...shell, mobileHeader: true }}>
        <Topbar title="Dashboard" />
      </SidebarContext>,
    );
    expect(screen.queryByRole('button', { name: 'Open navigation menu' })).not.toBeInTheDocument();
    expect(screen.getByRole('banner')).toHaveClass('max-md:top-18');
  });

  it('has no axe violations', async () => {
    render(<Topbar title="Dashboard" actions={<button type="button">Account</button>} />);
    await expectNoA11yViolations();
  });
});

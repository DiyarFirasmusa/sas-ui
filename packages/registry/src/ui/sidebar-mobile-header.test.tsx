import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SidebarContext } from '@/components/ui/sidebar';
import { SidebarMobileHeader } from '@/components/ui/sidebar-mobile-header';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function header(openMobile = vi.fn(), locale: 'en' | 'ar' = 'en') {
  renderWithLocale(
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
      <SidebarMobileHeader brand={<span>SAS Suite</span>} />
    </SidebarContext>,
    { locale },
  );
  return openMobile;
}

describe('SidebarMobileHeader', () => {
  it('is a 72px strip in the sidebar colours that only shows below md', () => {
    header();
    const strip = document.querySelector('[data-slot="mobile-header"]');
    expect(strip).toHaveClass(
      'h-18',
      'bg-sidebar',
      'text-sidebar-foreground',
      'md:hidden',
      'sticky',
    );
    expect(screen.getByText('SAS Suite')).toBeInTheDocument();
  });

  it('opens the drawer from the menu button, a 44px target', async () => {
    const openMobile = header();
    const menu = screen.getByRole('button', { name: 'Open navigation menu' });
    expect(menu).toHaveClass('size-11');
    expect(menu).toHaveAttribute('aria-haspopup', 'dialog');
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(menu);
    expect(openMobile).toHaveBeenCalledOnce();
  });

  it('is not a banner landmark', () => {
    header();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });

  it('takes a custom menu label and speaks Arabic', () => {
    header(vi.fn(), 'ar');
    expect(screen.getByRole('button', { name: 'فتح قائمة التنقل' })).toBeInTheDocument();
    render(<SidebarMobileHeader menuLabel="Menu" />);
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    header();
    await expectNoA11yViolations();
  });
});

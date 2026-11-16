import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SidebarContext } from '@/components/ui/sidebar';
import type { NavContext } from '@/components/ui/sidebar-nav-items';
import { SidebarNavRailItem } from '@/components/ui/sidebar-nav-rail';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { NavItem } from '@/lib/nav-utils';
import { expectNoA11yViolations } from '@/test/a11y';

function context(overrides: Partial<NavContext> = {}): NavContext {
  return {
    layout: 'default',
    activeId: null,
    exactActive: true,
    expanded: [],
    renderLink: ({ children, ...props }) => <a {...props}>{children}</a>,
    onToggle: vi.fn(),
    onOpen: vi.fn(),
    onNavigate: vi.fn(),
    toggleLabel: 'Toggle',
    ...overrides,
  };
}

function rail(item: NavItem, ctx: NavContext, setCollapsed = vi.fn()) {
  render(
    <SidebarContext
      value={{
        inShell: true,
        collapsed: true,
        setCollapsed,
        variant: 'desktop',
        mobileOpen: false,
        openMobile: () => {},
        closeMobile: () => {},
      }}
    >
      <TooltipProvider delay={0}>
        <ul>
          <SidebarNavRailItem item={item} context={ctx} />
        </ul>
      </TooltipProvider>
    </SidebarContext>,
  );
  return setCollapsed;
}

const icon = <svg aria-hidden="true" />;

describe('SidebarNavRailItem', () => {
  it('is a 44px icon link with a tooltip, and navigating reports the item', async () => {
    const ctx = context();
    rail({ id: 'home', label: 'Home', href: '/', icon }, ctx);
    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveClass('size-11', 'rounded-xl', 'text-sidebar-foreground');
    await userEvent.hover(link);
    expect(
      await screen.findByText('Home', { selector: '[data-slot="tooltip-content"]' }),
    ).toBeInTheDocument();
    await userEvent.click(link);
    expect(ctx.onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: 'home' }));
  });

  it('uses the selected tokens and aria-current for the active page', () => {
    rail({ id: 'home', label: 'Home', href: '/', icon }, context({ activeId: 'home' }));
    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveClass('bg-sidebar-selected', 'text-sidebar-selected-foreground');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('opens a group and expands the sidebar when its icon is pressed', async () => {
    const ctx = context();
    const setCollapsed = rail(
      {
        id: 'sales',
        label: 'Sales',
        icon,
        badge: 2,
        children: [{ id: 'orders', label: 'Orders', href: '/orders' }],
      },
      ctx,
    );
    const button = screen.getByRole('button', { name: 'Sales' });
    expect(button.querySelector('[data-slot="sidebar-badge-dot"]')).toBeInTheDocument();
    await userEvent.click(button);
    expect(ctx.onOpen).toHaveBeenCalledWith('sales');
    expect(setCollapsed).toHaveBeenCalledWith(false);
  });

  it('does not react when disabled', () => {
    rail(
      { id: 'x', label: 'Soon', icon, disabled: true, children: [{ id: 'y', label: 'Y' }] },
      context(),
    );
    expect(screen.getByRole('button', { name: 'Soon' })).toBeDisabled();
  });

  it('has no axe violations', async () => {
    rail({ id: 'home', label: 'Home', href: '/', icon }, context());
    await expectNoA11yViolations();
  });
});

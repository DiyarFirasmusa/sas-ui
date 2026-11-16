import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { SidebarContext, type SidebarContextValue } from '@/components/ui/sidebar';
import { SidebarUser } from '@/components/ui/sidebar-user';
import { TooltipProvider } from '@/components/ui/tooltip';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const base: SidebarContextValue = {
  inShell: true,
  collapsed: false,
  setCollapsed: () => {},
  variant: 'desktop',
  mobileOpen: false,
  openMobile: () => {},
  closeMobile: () => {},
};

function user(
  value: Partial<SidebarContextValue> = {},
  props: { drawerOnly?: boolean; onSignOut?: () => void } = {},
) {
  return renderWithLocale(
    <SidebarContext value={{ ...base, ...value }}>
      <TooltipProvider delay={0}>
        <SidebarUser
          name="Layla Hassan"
          subtitle="Operations manager"
          drawerOnly={props.drawerOnly}
        >
          <DropdownMenuItem onClick={props.onSignOut}>Sign out</DropdownMenuItem>
        </SidebarUser>
      </TooltipProvider>
    </SidebarContext>,
  );
}

describe('SidebarUser', () => {
  it('shows the avatar, name and role on a ghost row that opens the menu', async () => {
    const onSignOut = vi.fn();
    user({}, { onSignOut });
    const trigger = document.querySelector('[data-slot="sidebar-user"]');
    expect(trigger).toHaveClass('hover:bg-sidebar-accent', 'text-sidebar-foreground');
    expect(screen.getByText('Layla Hassan')).toHaveClass('text-h5');
    expect(screen.getByText('Operations manager')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('shrinks to the avatar in the rail, with a name tooltip and a labelled button', async () => {
    user({ collapsed: true });
    expect(screen.queryByText('Operations manager')).not.toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Account menu for Layla Hassan' });
    expect(button).toHaveClass('size-11');
    await userEvent.hover(button);
    expect(
      await screen.findByText('Layla Hassan', { selector: '[data-slot="tooltip-content"]' }),
    ).toBeInTheDocument();
  });

  it('with drawerOnly renders in the phone drawer and not on desktop', () => {
    const desktop = user({}, { drawerOnly: true });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    desktop.unmount();
    user({ variant: 'drawer' }, { drawerOnly: true });
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('localises the rail label in Arabic', () => {
    renderWithLocale(
      <SidebarContext value={{ ...base, collapsed: true }}>
        <SidebarUser name="ليلى حسن">
          <DropdownMenuItem>خروج</DropdownMenuItem>
        </SidebarUser>
      </SidebarContext>,
      { locale: 'ar' },
    );
    expect(screen.getByRole('button', { name: 'قائمة حساب ليلى حسن' })).toBeInTheDocument();
  });

  it('has no axe violations closed and open', async () => {
    const { container } = user();
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button'));
    await screen.findByRole('menu');
    await expectNoA11yViolations(document.body);
  });
});

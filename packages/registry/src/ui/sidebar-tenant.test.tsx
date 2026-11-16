import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SidebarContext, type SidebarContextValue } from '@/components/ui/sidebar';
import { SidebarTenant } from '@/components/ui/sidebar-tenant';
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

function inSidebar(value: Partial<SidebarContextValue>, locale: 'en' | 'ar' = 'en') {
  return renderWithLocale(
    <SidebarContext value={{ ...base, ...value }}>
      <TooltipProvider delay={0}>
        <SidebarTenant
          label={locale === 'ar' ? 'مساحة العمل' : 'Workspace'}
          name={locale === 'ar' ? 'المستودع الرئيسي' : 'Main depot'}
          detail="Erbil"
        />
      </TooltipProvider>
    </SidebarContext>,
    { locale },
  );
}

describe('SidebarTenant', () => {
  it('shows a tinted card with a small label over the name', () => {
    inSidebar({});
    const card = document.querySelector('[data-slot="sidebar-tenant"]');
    expect(card).toHaveClass('bg-sidebar-accent', 'rounded-xl', 'p-3');
    expect(screen.getByText('Workspace')).toHaveClass('text-b3');
    expect(screen.getByText('Main depot')).toHaveClass('text-label', 'line-clamp-2');
  });

  it('becomes one named icon tile with a tooltip in the rail', async () => {
    inSidebar({ collapsed: true });
    expect(screen.queryByText('Main depot')).not.toBeInTheDocument();
    const tile = screen.getByRole('img', { name: 'Workspace: Main depot' });
    expect(tile).toHaveClass('border-sidebar-border', 'bg-sidebar-accent');
    await userEvent.hover(tile);
    expect(
      await screen.findByText('Workspace: Main depot', {
        selector: '[data-slot="tooltip-content"]',
      }),
    ).toBeInTheDocument();
  });

  it('renders the info card with the label and detail in the hr layout', () => {
    inSidebar({ layout: 'hr' });
    expect(document.querySelector('[data-slot="sidebar-info-card"]')).toBeInTheDocument();
    expect(screen.getByText('Workspace · Erbil')).toBeInTheDocument();
    expect(screen.getByText('Main depot')).toBeInTheDocument();
  });

  it('works in Arabic', () => {
    inSidebar({}, 'ar');
    expect(screen.getByText('المستودع الرئيسي')).toHaveAttribute('dir', 'auto');
  });

  it('has no axe violations in the card, the rail and the hr layout', async () => {
    const { unmount } = inSidebar({});
    await expectNoA11yViolations();
    unmount();
    const rail = inSidebar({ collapsed: true });
    await expectNoA11yViolations();
    rail.unmount();
    render(
      <SidebarContext value={{ ...base, layout: 'hr' }}>
        <SidebarTenant label="Entity" name="HQ" />
      </SidebarContext>,
    );
    await expectNoA11yViolations();
  });
});

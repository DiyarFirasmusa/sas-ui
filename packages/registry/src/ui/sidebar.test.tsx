import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import {
  Sidebar,
  SidebarBrand,
  SidebarContent,
  SidebarContext,
  SidebarFooter,
  useSidebar,
  type SidebarContextValue,
} from '@/components/ui/sidebar';
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

function Harness({
  initiallyCollapsed = false,
  context,
}: {
  initiallyCollapsed?: boolean;
  context?: Partial<SidebarContextValue>;
}) {
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);
  return (
    <SidebarContext value={{ ...base, collapsed, setCollapsed, ...context }}>
      <Sidebar>
        <SidebarBrand logo={<span>L</span>} title="SAS Suite" subtitle="Admin" />
        <SidebarContent>
          <p>Content</p>
        </SidebarContent>
        <SidebarFooter status="All systems operational" version="v1.4.0">
          <p>Footer</p>
        </SidebarFooter>
      </Sidebar>
    </SidebarContext>
  );
}

function inContext(value: Partial<SidebarContextValue>, children: ReactNode) {
  return <SidebarContext value={{ ...base, ...value }}>{children}</SidebarContext>;
}

describe('Sidebar', () => {
  it('is a labelled complementary landmark using the sidebar tokens and the 244px column', () => {
    render(<Harness />);
    const sidebar = screen.getByRole('complementary', { name: 'Sidebar' });
    expect(sidebar).toHaveClass(
      'bg-sidebar',
      'text-sidebar-foreground',
      'border-e',
      'border-sidebar-border',
      'w-61',
      'px-3',
    );
    expect(sidebar).toHaveAttribute('data-layout', 'default');
    expect(sidebar).not.toHaveAttribute('data-collapsed');
  });

  it('shows the brand title and subtitle when expanded', () => {
    render(<Harness />);
    expect(screen.getByText('SAS Suite')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('puts the rail toggle in the brand row and collapses to a 64px rail that keeps only the logo', async () => {
    render(<Harness />);
    const brand = document.querySelector('[data-slot="sidebar-brand"]');
    expect(brand).toContainElement(screen.getByRole('button', { name: 'Collapse sidebar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('w-16', 'px-2');
    expect(sidebar).toHaveAttribute('data-collapsed');
    expect(screen.queryByText('SAS Suite')).not.toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
    const expand = screen.getByRole('button', { name: 'Expand sidebar' });
    expect(expand).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(expand);
    expect(screen.getByText('SAS Suite')).toBeInTheDocument();
  });

  it('can be collapsed through the prop without a shell, and then has no toggle', () => {
    render(
      <Sidebar collapsed>
        <SidebarBrand title="SAS Suite" />
      </Sidebar>,
    );
    expect(screen.getByRole('complementary')).toHaveAttribute('data-collapsed');
    expect(screen.queryByText('SAS Suite')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('leaves the toggle out when the shell says it is not collapsible', () => {
    render(<Harness context={{ collapsible: false }} />);
    expect(screen.queryByRole('button', { name: 'Collapse sidebar' })).not.toBeInTheDocument();
  });

  it('hides the collapse button inside the drawer and reserves room for its close button', () => {
    render(
      inContext(
        { variant: 'drawer', mobileOpen: true },
        <SidebarBrand title="SAS Suite" logo={<span>L</span>} />,
      ),
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="sidebar-brand"]')).toHaveClass('pe-10');
  });

  it('exposes defaults to parts used outside a shell', () => {
    function Probe() {
      const { inShell, collapsed, layout, collapsible, mobileHeader } = useSidebar();
      return <p>{[inShell, collapsed, layout, collapsible, mobileHeader].join('-')}</p>;
    }
    render(<Probe />);
    expect(screen.getByText('false-false-default-false-false')).toBeInTheDocument();
  });

  describe('hr layout', () => {
    it('is a fixed column with no border and no rail, even when asked to collapse', () => {
      render(
        <SidebarContext value={{ ...base, collapsed: true, layout: 'hr' }}>
          <Sidebar>
            <SidebarBrand logo={<span>L</span>} title="HR" />
          </Sidebar>
        </SidebarContext>,
      );
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveAttribute('data-layout', 'hr');
      expect(sidebar).toHaveClass('w-61', 'p-row');
      expect(sidebar).not.toHaveClass('border-e');
      expect(sidebar).not.toHaveAttribute('data-collapsed');
      expect(screen.getByText('HR')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('can be chosen with the variant prop outside a shell', () => {
      render(
        <Sidebar variant="hr">
          <SidebarBrand logo={<span>L</span>} title="HR" />
        </Sidebar>,
      );
      expect(screen.getByRole('complementary')).toHaveAttribute('data-layout', 'hr');
      expect(screen.getByText('L').parentElement).toHaveClass('size-10');
    });
  });

  describe('footer', () => {
    it('shows the status with the version left-to-right', () => {
      render(<Harness />);
      expect(screen.getByText('All systems operational')).toBeInTheDocument();
      expect(screen.getByText('v1.4.0')).toHaveAttribute('dir', 'ltr');
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('shrinks the status to a named dot in the rail', () => {
      render(<Harness initiallyCollapsed />);
      expect(screen.queryByText('All systems operational')).not.toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'All systems operational' })).toBeInTheDocument();
    });

    it('renders only its children when there is no status', () => {
      render(
        <SidebarFooter>
          <p>Help</p>
        </SidebarFooter>,
      );
      expect(screen.getByText('Help')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  it('localises labels in Arabic', () => {
    renderWithLocale(<Harness />, { locale: 'ar' });
    expect(screen.getByRole('complementary', { name: 'الشريط الجانبي' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'طي الشريط الجانبي' })).toBeInTheDocument();
  });

  it('keeps the sidebar parts logical in RTL (no physical classes) and mirrors the toggle icon', () => {
    renderWithLocale(<Harness />, { locale: 'ar' });
    const toggle = screen.getByRole('button', { name: 'طي الشريط الجانبي' });
    expect(toggle.querySelector('svg')).toHaveClass('rtl:-scale-x-100');
    expect(screen.getByRole('complementary')).toHaveClass('border-e');
  });

  it('has no axe violations expanded and collapsed', async () => {
    render(<Harness />);
    await expectNoA11yViolations();
    await userEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    await expectNoA11yViolations();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import {
  Sidebar,
  SidebarBrand,
  SidebarCollapseButton,
  SidebarContent,
  SidebarContext,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function Harness({ initiallyCollapsed = false }: { initiallyCollapsed?: boolean }) {
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);
  return (
    <SidebarContext
      value={{
        inShell: true,
        collapsed,
        setCollapsed,
        variant: 'desktop',
        mobileOpen: false,
        openMobile: () => {},
        closeMobile: () => {},
      }}
    >
      <Sidebar>
        <SidebarBrand logo={<span>L</span>} title="SAS Suite" subtitle="Admin" />
        <SidebarContent>
          <p>Content</p>
        </SidebarContent>
        <SidebarFooter>
          <p>Footer</p>
          <SidebarCollapseButton />
        </SidebarFooter>
      </Sidebar>
    </SidebarContext>
  );
}

describe('Sidebar', () => {
  it('is a labelled complementary landmark using the sidebar tokens', () => {
    render(<Harness />);
    const sidebar = screen.getByRole('complementary', { name: 'Sidebar' });
    expect(sidebar).toHaveClass(
      'bg-sidebar',
      'text-sidebar-foreground',
      'border-e',
      'border-sidebar-border',
    );
    expect(sidebar).toHaveClass('w-64');
    expect(sidebar).not.toHaveAttribute('data-collapsed');
  });

  it('shows the brand title and subtitle when expanded', () => {
    render(<Harness />);
    expect(screen.getByText('SAS Suite')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('collapses to a narrow rail that keeps only the logo', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('w-16');
    expect(sidebar).toHaveAttribute('data-collapsed');
    expect(screen.queryByText('SAS Suite')).not.toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
    const expand = screen.getByRole('button', { name: 'Expand sidebar' });
    expect(expand).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(expand);
    expect(screen.getByText('SAS Suite')).toBeInTheDocument();
  });

  it('can be collapsed through the prop without a shell', () => {
    render(
      <Sidebar collapsed>
        <SidebarBrand title="SAS Suite" />
      </Sidebar>,
    );
    expect(screen.getByRole('complementary')).toHaveAttribute('data-collapsed');
    expect(screen.queryByText('SAS Suite')).not.toBeInTheDocument();
  });

  it('hides the collapse button inside the drawer', () => {
    render(
      <SidebarContext
        value={{
          inShell: true,
          collapsed: false,
          setCollapsed: () => {},
          variant: 'drawer',
          mobileOpen: true,
          openMobile: () => {},
          closeMobile: () => {},
        }}
      >
        <SidebarCollapseButton />
      </SidebarContext>,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('exposes defaults to parts used outside a shell', () => {
    function Probe() {
      const { inShell, collapsed } = useSidebar();
      return <p>{`${String(inShell)}-${String(collapsed)}`}</p>;
    }
    render(<Probe />);
    expect(screen.getByText('false-false')).toBeInTheDocument();
  });

  it('localises labels in Arabic', () => {
    renderWithLocale(<Harness />, { locale: 'ar' });
    expect(screen.getByRole('complementary', { name: 'الشريط الجانبي' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'طي الشريط الجانبي' })).toBeInTheDocument();
  });

  it('has no axe violations expanded and collapsed', async () => {
    render(<Harness />);
    await expectNoA11yViolations();
    await userEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    await expectNoA11yViolations();
  });
});

import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from '@/components/ui/app-shell';
import { SidebarBrand, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/ui/sidebar-nav';
import { Topbar } from '@/components/ui/topbar';
import type { NavItem } from '@/lib/nav-utils';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const items: NavItem[] = [
  { id: 'home', label: 'Home', href: '/', exact: true },
  {
    id: 'sales',
    label: 'Sales',
    children: [{ id: 'orders', label: 'Orders', href: '/sales/orders' }],
  },
];

function Shell(props: Partial<React.ComponentProps<typeof AppShell>>) {
  return (
    <AppShell
      sidebar={
        <>
          <SidebarBrand title="SAS Suite" />
          <SidebarContent>
            <SidebarNav
              items={items}
              currentPath="/"
              renderLink={({ children, ...rest }) => (
                <a
                  {...rest}
                  onClick={(event) => {
                    event.preventDefault();
                    rest.onClick?.(event);
                  }}
                >
                  {children}
                </a>
              )}
            />
          </SidebarContent>
          <SidebarFooter>Footer</SidebarFooter>
        </>
      }
      topbar={<Topbar title="Dashboard" actions={<button type="button">Account</button>} />}
      {...props}
    >
      <h1>Page heading</h1>
    </AppShell>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AppShell', () => {
  it('lays out sidebar, topbar and main content', () => {
    render(<Shell />);
    expect(screen.getByRole('complementary', { name: 'Navigation' })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading', { name: 'Page heading' })).toBeInTheDocument();
  });

  it('starts keyboard order with a skip link that targets the main region', async () => {
    render(<Shell />);
    await userEvent.tab();
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skip).toHaveFocus();
    expect(skip).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
  });

  it('supports a custom main id and skip label', () => {
    render(<Shell mainId="content" skipLabel="Jump to content" />);
    expect(screen.getByRole('link', { name: 'Jump to content' })).toHaveAttribute(
      'href',
      '#content',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'content');
  });

  it('collapses the desktop sidebar to a rail and back', async () => {
    const onCollapsedChange = vi.fn();
    render(<Shell onCollapsedChange={onCollapsedChange} />);
    const aside = screen.getByRole('complementary', { name: 'Navigation' });
    expect(aside).toHaveClass('w-61');
    await userEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(aside).toHaveClass('w-16');
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
    expect(within(aside).queryByText('SAS Suite')).not.toBeInTheDocument();
    expect(within(aside).getByRole('link', { name: 'Home' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(aside).toHaveClass('w-61');
  });

  it('can start collapsed and be controlled', () => {
    const { rerender } = render(<Shell defaultCollapsed />);
    expect(screen.getByRole('complementary')).toHaveClass('w-16');
    rerender(<Shell collapsed={false} />);
    expect(screen.getByRole('complementary')).toHaveClass('w-61');
  });

  it('can omit the rail toggle of the brand row', () => {
    render(<Shell hideCollapseButton />);
    expect(screen.queryByRole('button', { name: 'Collapse sidebar' })).not.toBeInTheDocument();
  });

  it('offers the rail toggle in the brand row at the top of the sidebar', () => {
    render(<Shell />);
    const aside = screen.getByRole('complementary', { name: 'Navigation' });
    const brand = aside.querySelector('[data-slot="sidebar-brand"]');
    expect(brand).toContainElement(within(aside).getByRole('button', { name: 'Collapse sidebar' }));
  });

  it('pads the page like the dashboards: 16px on phones, 32px from md', () => {
    render(<Shell />);
    expect(screen.getByRole('main')).toHaveClass('p-4', 'md:p-page');
  });

  describe('phone header', () => {
    it('shows a strip in the sidebar colours with the menu button and brand, and takes the button from the topbar', async () => {
      render(<Shell mobileBrand={<span>SAS Suite mark</span>} />);
      const strip = document.querySelector('[data-slot="mobile-header"]');
      expect(strip).toHaveClass('bg-sidebar', 'h-18', 'md:hidden');
      expect(strip).toHaveTextContent('SAS Suite mark');
      expect(screen.getAllByRole('button', { name: 'Open navigation menu' })).toHaveLength(1);
      expect(strip).toContainElement(screen.getByRole('button', { name: 'Open navigation menu' }));
      expect(screen.getByRole('banner')).toHaveClass('max-md:top-18');
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
      expect(await screen.findByRole('dialog', { name: 'Navigation' })).toBeInTheDocument();
    });

    it('is not a second banner landmark', () => {
      render(<Shell mobileBrand="Brand" />);
      expect(screen.getAllByRole('banner')).toHaveLength(1);
    });
  });

  describe('hr variant', () => {
    it('uses the fixed column, no rail toggle and the comfortable page padding', () => {
      render(<Shell variant="hr" />);
      const aside = screen.getByRole('complementary', { name: 'Navigation' });
      expect(aside).toHaveAttribute('data-layout', 'hr');
      expect(aside).toHaveClass('w-61');
      expect(screen.queryByRole('button', { name: 'Collapse sidebar' })).not.toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveClass('md:px-7.5', 'md:py-6.5');
      expect(screen.getByRole('banner')).toHaveAttribute('data-variant', 'hr');
    });

    it('ignores a collapsed request and always shows the phone strip', () => {
      render(<Shell variant="hr" defaultCollapsed />);
      expect(screen.getByRole('complementary')).not.toHaveAttribute('data-collapsed');
      expect(document.querySelector('[data-slot="mobile-header"]')).toBeInTheDocument();
    });

    it('opens a wider drawer from the strip', async () => {
      render(<Shell variant="hr" />);
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
      const drawer = await screen.findByRole('dialog', { name: 'Navigation' });
      expect(drawer).toHaveClass('w-72', 'bg-sidebar');
    });
  });

  describe('mobile drawer', () => {
    it('opens from the topbar menu button as a start-edge dialog with the navigation', async () => {
      render(<Shell />);
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
      const drawer = await screen.findByRole('dialog', { name: 'Navigation' });
      expect(drawer).toHaveAttribute('data-side', 'start');
      expect(drawer).toHaveClass('bg-sidebar');
      expect(within(drawer).getByRole('link', { name: 'Home' })).toBeInTheDocument();
      // The drawer is never the collapsed rail, and has no rail toggle.
      expect(within(drawer).getByText('SAS Suite')).toBeInTheDocument();
      expect(
        within(drawer).queryByRole('button', { name: 'Collapse sidebar' }),
      ).not.toBeInTheDocument();
    });

    it('closes with Escape', async () => {
      render(<Shell />);
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
      await screen.findByRole('dialog');
      await userEvent.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes after following a link', async () => {
      render(<Shell />);
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
      const drawer = await screen.findByRole('dialog');
      await userEvent.click(within(drawer).getByRole('link', { name: 'Home' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes when the viewport grows to desktop width', async () => {
      const listeners = new Set<(event: MediaQueryListEvent) => void>();
      vi.stubGlobal('matchMedia', (media: string) => ({
        matches: false,
        media,
        onchange: null,
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners.add(listener);
        },
        removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners.delete(listener);
        },
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }));
      render(<Shell />);
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
      await screen.findByRole('dialog');
      act(() => {
        listeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent));
      });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('has no axe violations while open', async () => {
      render(<Shell />);
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
      await screen.findByRole('dialog');
      await expectNoA11yViolations();
    });
  });

  describe('RTL', () => {
    it('uses Arabic labels, keeps the sidebar first in DOM order (inline start) and slides the drawer from the start edge', async () => {
      renderWithLocale(<Shell />, { locale: 'ar' });
      expect(document.documentElement.dir).toBe('rtl');
      expect(screen.getByRole('link', { name: 'تخطي إلى المحتوى الرئيسي' })).toBeInTheDocument();
      const aside = screen.getByRole('complementary', { name: 'التنقل' });
      const main = screen.getByRole('main');
      // First in a flex row = inline start, which is the right edge under dir="rtl".
      expect(aside.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(aside).toHaveClass('border-e');
      await userEvent.click(screen.getByRole('button', { name: 'فتح قائمة التنقل' }));
      const drawer = await screen.findByRole('dialog', { name: 'التنقل' });
      expect(drawer).toHaveAttribute('data-side', 'start');
      expect(drawer.className).toContain('rtl:translate-x-full');
    });
  });

  it('has no axe violations', async () => {
    render(<Shell />);
    await expectNoA11yViolations();
  });
});

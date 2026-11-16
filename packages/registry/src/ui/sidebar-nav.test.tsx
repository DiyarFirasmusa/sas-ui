import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SidebarContext, type SidebarContextValue } from '@/components/ui/sidebar';
import { SidebarNav, type RenderNavLink } from '@/components/ui/sidebar-nav';
import type { NavItem } from '@/lib/nav-utils';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const items: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    exact: true,
    icon: <svg aria-hidden="true" />,
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: <svg aria-hidden="true" />,
    children: [
      { id: 'orders', label: 'Orders', href: '/sales/orders', badge: 3 },
      {
        id: 'invoices',
        label: 'Invoices',
        href: '/sales/invoices',
        badge: 250,
      },
    ],
  },
  {
    id: 'people',
    label: 'People',
    icon: <svg aria-hidden="true" />,
    children: [{ id: 'staff', label: 'Staff', href: '/people/staff' }],
  },
  { id: 'billing', label: 'Billing', href: '/billing', disabled: true },
];

function Nav(props: Partial<React.ComponentProps<typeof SidebarNav>>) {
  return <SidebarNav items={items} currentPath="/" {...props} />;
}

describe('SidebarNav', () => {
  it('renders links and marks the active one as the current page', () => {
    render(<Nav currentPath="/" />);
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('href', '/');
    expect(home).toHaveAttribute('aria-current', 'page');
  });

  it('opens the group that contains the active page and marks it', () => {
    render(<Nav currentPath="/sales/orders" />);
    expect(screen.getByRole('button', { name: /Sales/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /Orders/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /People/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('link', { name: 'Staff' })).not.toBeInTheDocument();
  });

  it('marks a page under a link as location, not page', () => {
    render(<Nav currentPath="/sales/orders/42" />);
    expect(screen.getByRole('link', { name: /Orders/ })).toHaveAttribute(
      'aria-current',
      'location',
    );
  });

  it('expands and collapses a group with the mouse and the keyboard', async () => {
    render(<Nav />);
    const people = screen.getByRole('button', { name: /People/ });
    await userEvent.click(people);
    expect(people).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByRole('link', { name: 'Staff' })).toBeInTheDocument();
    people.focus();
    await userEvent.keyboard('{Enter}');
    expect(people).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard(' ');
    expect(people).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes sibling groups in accordion mode', async () => {
    render(<Nav accordion currentPath="/sales/orders" />);
    await userEvent.click(screen.getByRole('button', { name: /People/ }));
    expect(screen.getByRole('button', { name: /Sales/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /People/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('reports expansion changes and supports a controlled state', async () => {
    const onExpandedChange = vi.fn();
    render(<Nav expanded={[]} onExpandedChange={onExpandedChange} />);
    await userEvent.click(screen.getByRole('button', { name: /People/ }));
    expect(onExpandedChange).toHaveBeenCalledWith(['people']);
    expect(screen.getByRole('button', { name: /People/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('shows badges, capped, and sums them on a closed group', async () => {
    render(<Nav currentPath="/" />);
    const sales = screen.getByRole('button', { name: /Sales/ });
    expect(within(sales).getByText('99+')).toBeInTheDocument();
    await userEvent.click(sales);
    expect(within(screen.getByRole('link', { name: /Orders/ })).getByText('3')).toBeInTheDocument();
    expect(
      within(screen.getByRole('link', { name: /Invoices/ })).getByText('99+'),
    ).toBeInTheDocument();
  });

  it('lets the app render links with its router', async () => {
    const renderLink = vi.fn<RenderNavLink>(({ children, ...rest }) => (
      <a data-router="true" data-to={rest.href} {...rest}>
        {children}
      </a>
    ));
    render(<Nav renderLink={renderLink} />);
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('data-router', 'true');
    expect(home).toHaveAttribute('data-to', '/');
    expect(renderLink.mock.calls[0]?.[1]?.id).toBe('home');
  });

  it('follows isActive instead of the path', () => {
    render(<Nav currentPath="/" isActive={(item) => item.id === 'staff'} />);
    expect(screen.getByRole('button', { name: /People/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Staff' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('calls onNavigate and closes the mobile drawer on link press', async () => {
    const onNavigate = vi.fn();
    const closeMobile = vi.fn();
    const value: SidebarContextValue = {
      inShell: true,
      collapsed: false,
      setCollapsed: vi.fn(),
      variant: 'drawer',
      mobileOpen: true,
      openMobile: vi.fn(),
      closeMobile,
    };
    render(
      <SidebarContext value={value}>
        <Nav
          onNavigate={onNavigate}
          renderLink={({ children, ...props }) => (
            <a
              {...props}
              onClick={(event) => {
                event.preventDefault();
                props.onClick?.(event);
              }}
            >
              {children}
            </a>
          )}
        />
      </SidebarContext>,
    );
    await userEvent.click(screen.getByRole('link', { name: 'Home' }));
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: 'home' }));
    expect(closeMobile).toHaveBeenCalledOnce();
  });

  it('does not make disabled items navigable', () => {
    render(<Nav />);
    expect(screen.queryByRole('link', { name: 'Billing' })).not.toBeInTheDocument();
    expect(screen.getByText('Billing').closest('[aria-disabled]')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('keeps focus order and exposes the nav landmark', async () => {
    render(<Nav />);
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: /Sales/ })).toHaveFocus();
  });

  describe('collapsed rail', () => {
    function rail(setCollapsed = vi.fn()) {
      const value: SidebarContextValue = {
        inShell: true,
        collapsed: true,
        setCollapsed,
        variant: 'desktop',
        mobileOpen: false,
        openMobile: vi.fn(),
        closeMobile: vi.fn(),
      };
      render(
        <SidebarContext value={value}>
          <Nav />
        </SidebarContext>,
      );
      return setCollapsed;
    }

    it('shows icon-only entries that keep their names', () => {
      rail();
      const home = screen.getByRole('link', { name: 'Home' });
      expect(home).toHaveClass('size-11', 'rounded-xl', 'bg-sidebar-selected');
      expect(screen.getByRole('button', { name: 'Sales' })).toBeInTheDocument();
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });

    it('names each icon in a tooltip on hover and on keyboard focus', async () => {
      rail();
      await userEvent.hover(screen.getByRole('link', { name: 'Home' }));
      expect(await screen.findByText('Home')).toHaveAttribute('data-slot', 'tooltip-content');
      await userEvent.unhover(screen.getByRole('link', { name: 'Home' }));
      await userEvent.tab();
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'Sales' })).toHaveFocus();
      expect(
        await screen.findByText('Sales', { selector: '[data-slot="tooltip-content"]' }),
      ).toBeInTheDocument();
    });

    it('marks a group icon as selected when the active page is inside it', () => {
      const value: SidebarContextValue = {
        inShell: true,
        collapsed: true,
        setCollapsed: vi.fn(),
        variant: 'desktop',
        mobileOpen: false,
        openMobile: vi.fn(),
        closeMobile: vi.fn(),
      };
      render(
        <SidebarContext value={value}>
          <Nav currentPath="/sales/orders" />
        </SidebarContext>,
      );
      expect(screen.getByRole('button', { name: 'Sales' })).toHaveClass('bg-sidebar-selected');
      expect(
        screen
          .getByRole('button', { name: 'Sales' })
          .querySelector('[data-slot="sidebar-badge-dot"]'),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'People' })).not.toHaveClass('bg-sidebar-selected');
    });

    it('lists pinned entries last under a divider', () => {
      const pinned: NavItem[] = [
        ...items.slice(0, 2),
        {
          id: 'help',
          label: 'Help',
          href: '/help',
          icon: <svg aria-hidden="true" />,
          pinned: true,
        },
      ];
      render(
        <SidebarContext
          value={{
            inShell: true,
            collapsed: true,
            setCollapsed: vi.fn(),
            variant: 'desktop',
            mobileOpen: false,
            openMobile: vi.fn(),
            closeMobile: vi.fn(),
          }}
        >
          <SidebarNav items={pinned} currentPath="/" />
        </SidebarContext>,
      );
      const help = screen.getByRole('link', { name: 'Help' });
      expect(help.closest('ul')).toHaveClass('mt-auto', 'border-t');
    });

    it('expands the sidebar when a group icon is pressed', async () => {
      const setCollapsed = rail();
      await userEvent.click(screen.getByRole('button', { name: 'People' }));
      expect(setCollapsed).toHaveBeenCalledWith(false);
    });
  });

  describe('styling', () => {
    it('draws top-level rows as 44px icon rows and the active one from the selected tokens', () => {
      render(<Nav currentPath="/" />);
      const home = screen.getByRole('link', { name: 'Home' });
      expect(home).toHaveClass(
        'h-11',
        'rounded-xl',
        'bg-sidebar-selected',
        'text-sidebar-selected-foreground',
      );
      expect(screen.getByRole('button', { name: /People/ })).toHaveClass(
        'h-11',
        'text-sidebar-foreground',
      );
    });

    it('draws nested links as 36px rows with a bar on the current page', () => {
      render(<Nav currentPath="/sales/orders" />);
      const orders = screen.getByRole('link', { name: /Orders/ });
      expect(orders).toHaveClass('h-9', 'rounded-lg', 'text-sidebar-foreground');
      expect(orders.querySelector('span[aria-hidden="true"]')).toHaveClass('bg-sidebar-foreground');
      expect(screen.getByRole('link', { name: /Invoices/ })).toHaveClass(
        'text-sidebar-foreground/70',
      );
      expect(orders.closest('ul')).toHaveClass('border-s', 'border-sidebar-border');
    });

    it('tints an open group and shows the badge total of a closed one', async () => {
      render(<Nav currentPath="/" />);
      const sales = screen.getByRole('button', { name: /Sales/ });
      expect(sales).toHaveTextContent('99+');
      await userEvent.click(sales);
      expect(sales).toHaveClass('bg-sidebar-accent');
    });
  });

  describe('pinned entries', () => {
    const withPinned: NavItem[] = [
      ...items.slice(0, 2),
      { id: 'settings', label: 'Settings', href: '/settings', pinned: true },
    ];

    it('sit in their own list at the bottom under a divider', () => {
      render(<SidebarNav items={withPinned} currentPath="/" />);
      const settings = screen.getByRole('link', { name: 'Settings' });
      const list = settings.closest('ul');
      expect(list).toHaveClass('mt-auto', 'border-t', 'border-sidebar-border');
      expect(screen.getByRole('link', { name: 'Home' }).closest('ul')).not.toBe(list);
    });
  });

  describe('hr layout', () => {
    function flat(path = '/') {
      return (
        <SidebarContext
          value={{
            inShell: true,
            collapsed: false,
            setCollapsed: vi.fn(),
            variant: 'desktop',
            mobileOpen: false,
            openMobile: vi.fn(),
            closeMobile: vi.fn(),
            layout: 'hr',
          }}
        >
          <SidebarNav items={items} currentPath={path} />
        </SidebarContext>
      );
    }

    it('shows groups as flat sections under small headings, with no accordion', () => {
      render(flat());
      expect(screen.getByText('Sales')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Sales/ })).not.toBeInTheDocument();
      const orders = screen.getByRole('link', { name: /Orders/ });
      expect(orders.closest('ul')).toHaveAccessibleName('Sales');
      expect(screen.getByRole('link', { name: 'Staff' })).toBeInTheDocument();
    });

    it('marks the current page with the accent tokens on a 40px row', () => {
      render(flat('/sales/orders'));
      expect(screen.getByRole('link', { name: /Orders/ })).toHaveClass(
        'h-10',
        'rounded-md',
        'bg-sidebar-accent',
        'text-sidebar-accent-foreground',
      );
      expect(screen.getByRole('link', { name: /Invoices/ })).not.toHaveClass('bg-sidebar-accent');
    });

    it('lists pinned groups last as their own labelled section under a divider', () => {
      render(
        <SidebarContext
          value={{
            inShell: true,
            collapsed: false,
            setCollapsed: vi.fn(),
            variant: 'desktop',
            mobileOpen: false,
            openMobile: vi.fn(),
            closeMobile: vi.fn(),
            layout: 'hr',
          }}
        >
          <SidebarNav
            items={[
              ...items,
              {
                id: 'entity',
                label: 'Entity settings',
                pinned: true,
                children: [{ id: 'units', label: 'Units', href: '/units' }],
              },
            ]}
            currentPath="/"
          />
        </SidebarContext>,
      );
      const units = screen.getByRole('link', { name: 'Units' });
      expect(units.closest('ul')).toHaveAccessibleName('Entity settings');
      expect(units.closest('ul')?.parentElement?.parentElement).toHaveClass('mt-auto', 'border-t');
    });

    it('does not collapse to a rail', () => {
      render(
        <SidebarContext
          value={{
            inShell: true,
            collapsed: true,
            setCollapsed: vi.fn(),
            variant: 'desktop',
            mobileOpen: false,
            openMobile: vi.fn(),
            closeMobile: vi.fn(),
            layout: 'hr',
          }}
        >
          <SidebarNav items={items} currentPath="/" />
        </SidebarContext>,
      );
      expect(screen.getByText('People')).toBeInTheDocument();
    });
  });

  it('localises the landmark and group toggles and keeps RTL order', async () => {
    renderWithLocale(<Nav currentPath="/sales/orders" />, { locale: 'ar' });
    expect(screen.getByRole('navigation', { name: 'التنقل الرئيسي' })).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByRole('button', { name: /Sales/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('has no axe violations with groups closed and open', async () => {
    render(<Nav currentPath="/sales/orders" />);
    await expectNoA11yViolations();
    await userEvent.click(screen.getByRole('button', { name: /People/ }));
    await expectNoA11yViolations();
  });
});

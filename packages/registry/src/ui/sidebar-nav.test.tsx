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
      expect(home).toHaveAttribute('title', 'Home');
      expect(screen.getByRole('button', { name: 'Sales' })).toBeInTheDocument();
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });

    it('expands the sidebar when a group icon is pressed', async () => {
      const setCollapsed = rail();
      await userEvent.click(screen.getByRole('button', { name: 'People' }));
      expect(setCollapsed).toHaveBeenCalledWith(false);
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

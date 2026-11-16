import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ShellTopNav, type ShellRenderLink } from '@/components/blocks/shell-top-nav';
import type { NavItem } from '@/lib/nav-utils';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const items: NavItem[] = [
  { id: 'home', label: 'Home', href: '/', exact: true },
  {
    id: 'reports',
    label: 'Reports',
    children: [
      { id: 'sales', label: 'Sales', href: '/reports/sales' },
      {
        id: 'more',
        label: 'More',
        children: [{ id: 'tax', label: 'Tax', href: '/reports/tax' }],
      },
    ],
  },
  { id: 'off', label: 'Archive', href: '/archive', disabled: true },
];

describe('ShellTopNav', () => {
  it('marks the current page and the group that holds it', () => {
    renderWithLocale(<ShellTopNav items={items} currentPath="/reports/sales" />);
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: 'Reports' }).className).toContain('bg-primary-light');
    expect(screen.getByText('Archive')).toHaveAttribute('aria-disabled', 'true');
  });

  it('calls onNavigate for a link', async () => {
    const onNavigate = vi.fn();
    renderWithLocale(<ShellTopNav items={items} currentPath="/" onNavigate={onNavigate} />);
    const link = screen.getByRole('link', { name: 'Home' });
    link.addEventListener('click', (event) => event.preventDefault());
    await userEvent.click(link);
    expect(onNavigate).toHaveBeenCalledWith(items[0]);
  });

  it('opens a dropdown, with nested submenus, and navigates from it', async () => {
    const onNavigate = vi.fn();
    renderWithLocale(<ShellTopNav items={items} currentPath="/" onNavigate={onNavigate} />);
    await userEvent.click(screen.getByRole('button', { name: 'Reports' }));
    const sales = await screen.findByRole('menuitem', { name: 'Sales' });
    expect(sales).toHaveAttribute('href', '/reports/sales');
    await userEvent.click(screen.getByRole('menuitem', { name: 'More' }));
    expect(await screen.findByRole('menuitem', { name: 'Tax' })).toBeInTheDocument();
  });

  it('renders every link, menu entries included, through renderLink', async () => {
    const renderLink = vi.fn<ShellRenderLink>((props, item) => (
      <a {...props} data-router-link={item.id} />
    ));
    renderWithLocale(<ShellTopNav items={items} currentPath="/" renderLink={renderLink} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('data-router-link', 'home');
    await userEvent.click(screen.getByRole('button', { name: 'Reports' }));
    expect(await screen.findByRole('menuitem', { name: 'Sales' })).toHaveAttribute(
      'data-router-link',
      'sales',
    );
  });

  it('opens a dropdown with the keyboard', async () => {
    renderWithLocale(<ShellTopNav items={items} currentPath="/" />);
    screen.getByRole('button', { name: 'Reports' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('menuitem', { name: 'Sales' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menuitem', { name: 'Sales' })).not.toBeInTheDocument();
  });

  it('renders the Arabic navigation label', () => {
    renderWithLocale(<ShellTopNav items={items} currentPath="/" />, { locale: 'ar' });
    expect(screen.getByRole('navigation', { name: 'التنقل الرئيسي' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(
      <ShellTopNav items={items} currentPath="/reports/sales" />,
    );
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Reports' }));
    await screen.findByRole('menuitem', { name: 'Sales' });
    await expectNoA11yViolations(document.body);
  });
});

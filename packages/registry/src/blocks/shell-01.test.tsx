import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Shell01 } from '@/components/blocks/shell-01';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('Shell01', () => {
  it('renders the sidebar, the topbar title and the page', () => {
    renderWithLocale(
      <Shell01 currentPath="/customers" title="Customers">
        <h1>Page content</h1>
      </Shell01>,
    );
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(nav).getByRole('link', { name: 'Customers' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const sidebar = screen.getByRole('complementary', { name: 'Navigation' });
    expect(within(sidebar).getByText('SAS Suite')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Page content' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('takes the navigation from props and reports navigation', async () => {
    const onNavigate = vi.fn();
    renderWithLocale(
      <Shell01
        items={[
          { id: 'a', label: 'Alpha', href: '/alpha' },
          { id: 'g', label: 'Group', children: [{ id: 'b', label: 'Beta', href: '/beta' }] },
        ]}
        currentPath="/alpha"
        onNavigate={onNavigate}
      >
        <p>content</p>
      </Shell01>,
    );
    await userEvent.click(screen.getByRole('button', { name: /Group/ }));
    const beta = await screen.findByRole('link', { name: 'Beta' });
    beta.addEventListener('click', (event) => event.preventDefault());
    await userEvent.click(beta);
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }));
  });

  it('opens the command palette from the button and from Ctrl+K, and navigates to a page', async () => {
    const onNavigate = vi.fn();
    renderWithLocale(
      <Shell01 onNavigate={onNavigate}>
        <p>content</p>
      </Shell01>,
    );
    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.type(await screen.findByRole('combobox'), 'invoices');
    await userEvent.click(screen.getByRole('option', { name: 'Invoices' }));
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: 'invoices' }));
  });

  it('shows the unread count on the bell', () => {
    renderWithLocale(
      <Shell01
        notifications={[
          { id: '1', title: 'One' },
          { id: '2', title: 'Two' },
        ]}
      >
        <p>content</p>
      </Shell01>,
    );
    expect(screen.getByRole('button', { name: 'Notifications, 2 unread' })).toBeInTheDocument();
  });

  it('signs out from the account chip of the topbar', async () => {
    const onSignOut = vi.fn();
    renderWithLocale(
      <Shell01 onSignOut={onSignOut}>
        <p>content</p>
      </Shell01>,
    );
    const banner = screen.getByRole('banner');
    await userEvent.click(within(banner).getByRole('button', { name: /Account menu for Layla/ }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('can put the account block at the bottom of the sidebar instead', async () => {
    const onSignOut = vi.fn();
    renderWithLocale(
      <Shell01 userPlacement="sidebar" onSignOut={onSignOut}>
        <p>content</p>
      </Shell01>,
    );
    expect(
      within(screen.getByRole('banner')).queryByRole('button', { name: /Account menu/ }),
    ).not.toBeInTheDocument();
    const sidebar = screen.getByRole('complementary', { name: 'Navigation' });
    await userEvent.click(within(sidebar).getByText('Layla Hassan'));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('shows the workspace card and the status line, and can leave them out', () => {
    const { unmount } = renderWithLocale(
      <Shell01 version="v2.1.0">
        <p>content</p>
      </Shell01>,
    );
    const sidebar = screen.getByRole('complementary', { name: 'Navigation' });
    expect(within(sidebar).getByText('Workspace')).toBeInTheDocument();
    expect(within(sidebar).getByText('Northwind Trading')).toBeInTheDocument();
    expect(within(sidebar).getByText('All systems operational')).toBeInTheDocument();
    expect(within(sidebar).getByText('v2.1.0')).toBeInTheDocument();
    unmount();
    renderWithLocale(
      <Shell01 workspace={false} status={false}>
        <p>content</p>
      </Shell01>,
    );
    expect(screen.queryByText('Northwind Trading')).not.toBeInTheDocument();
    expect(screen.queryByText('All systems operational')).not.toBeInTheDocument();
  });

  it('puts theme and language controls in the topbar when their handlers are given', async () => {
    const onModeChange = vi.fn();
    const onLocaleChange = vi.fn();
    renderWithLocale(
      <Shell01 mode="light" onModeChange={onModeChange} onLocaleChange={onLocaleChange}>
        <p>content</p>
      </Shell01>,
    );
    const banner = screen.getByRole('banner');
    await userEvent.click(within(banner).getByRole('button', { name: 'Dark' }));
    expect(onModeChange).toHaveBeenCalledWith('dark');
    await userEvent.click(within(banner).getByRole('button', { name: 'Language: English' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'العربية' }));
    expect(onLocaleChange).toHaveBeenCalledWith('ar');
  });

  it('leaves out the theme and language controls without handlers', () => {
    renderWithLocale(
      <Shell01>
        <p>content</p>
      </Shell01>,
    );
    expect(screen.queryByRole('group', { name: 'Theme' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Language/ })).not.toBeInTheDocument();
  });

  it('uses the phone strip with the brand and the sidebar-coloured topbar', () => {
    renderWithLocale(
      <Shell01 title="Customers">
        <p>content</p>
      </Shell01>,
    );
    expect(document.querySelector('[data-slot="mobile-header"]')).toHaveTextContent('SAS Suite');
    expect(screen.getByRole('banner')).toHaveAttribute('data-variant', 'sidebar');
  });

  describe('hr variant', () => {
    it('shows the tenant info card, flat sections and the hr topbar', () => {
      renderWithLocale(
        <Shell01 variant="hr" title="Employees" currentPath="/customers">
          <p>content</p>
        </Shell01>,
      );
      const sidebar = screen.getByRole('complementary', { name: 'Navigation' });
      expect(sidebar).toHaveAttribute('data-layout', 'hr');
      expect(sidebar.querySelector('[data-slot="sidebar-info-card"]')).toBeInTheDocument();
      expect(within(sidebar).queryByRole('button', { name: /Projects/ })).not.toBeInTheDocument();
      expect(within(sidebar).getByRole('link', { name: 'All projects' })).toBeInTheDocument();
      expect(within(sidebar).queryByText('All systems operational')).not.toBeInTheDocument();
      expect(screen.getByRole('banner')).toHaveAttribute('data-variant', 'hr');
    });

    it('keeps language and theme reachable in the phone drawer, where the topbar is hidden', async () => {
      const onLocaleChange = vi.fn();
      renderWithLocale(
        <Shell01 variant="hr" onLocaleChange={onLocaleChange} onModeChange={() => {}}>
          <p>content</p>
        </Shell01>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
      const drawer = await screen.findByRole('dialog');
      await userEvent.click(within(drawer).getByText('Layla Hassan'));
      expect(await screen.findByRole('menuitem', { name: /Language/ })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Theme/ })).toBeInTheDocument();
    });

    it('does not repeat the user block in the desktop sidebar', () => {
      renderWithLocale(
        <Shell01 variant="hr">
          <p>content</p>
        </Shell01>,
      );
      const sidebar = screen.getByRole('complementary', { name: 'Navigation' });
      expect(within(sidebar).queryByText('Layla Hassan')).not.toBeInTheDocument();
    });
  });

  it('opens the navigation drawer from the topbar menu button', async () => {
    renderWithLocale(
      <Shell01>
        <p>content</p>
      </Shell01>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('renders Arabic navigation, brand and account labels', () => {
    renderWithLocale(
      <Shell01 currentPath="/customers">
        <p>content</p>
      </Shell01>,
      { locale: 'ar' },
    );
    expect(screen.getByRole('link', { name: 'العملاء' })).toHaveAttribute('aria-current', 'page');
    expect(within(screen.getByRole('complementary')).getByText('حزمة ساس')).toBeInTheDocument();
    expect(screen.getByText('ليلى حسن')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /الإشعارات/ })).toBeInTheDocument();
  });

  it('collapses to a rail whose icons are named and whose footer is a dot', async () => {
    renderWithLocale(
      <Shell01 currentPath="/customers">
        <p>content</p>
      </Shell01>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    const sidebar = screen.getByRole('complementary', { name: 'Navigation' });
    expect(sidebar).toHaveClass('w-16');
    expect(within(sidebar).getByRole('link', { name: 'Customers' })).toBeInTheDocument();
    expect(
      within(sidebar).getByRole('img', { name: 'All systems operational' }),
    ).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(
      <Shell01 title="Dashboard" currentPath="/dashboard">
        <h1>Dashboard</h1>
      </Shell01>,
    );
    await expectNoA11yViolations(container);
  });

  it('has no axe violations in the hr variant, in Arabic', async () => {
    const { container } = renderWithLocale(
      <Shell01 variant="hr" title="الموظفون" currentPath="/customers">
        <h1>الموظفون</h1>
      </Shell01>,
      { locale: 'ar' },
    );
    await expectNoA11yViolations(container);
  });
});

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
    expect(screen.getByText('SAS Suite')).toBeInTheDocument();
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

  it('signs out from the account menu in the sidebar', async () => {
    const onSignOut = vi.fn();
    renderWithLocale(
      <Shell01 onSignOut={onSignOut}>
        <p>content</p>
      </Shell01>,
    );
    await userEvent.click(screen.getByText('Layla Hassan'));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledOnce();
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
    expect(screen.getByText('حزمة ساس')).toBeInTheDocument();
    expect(screen.getByText('ليلى حسن')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /الإشعارات/ })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(
      <Shell01 title="Dashboard" currentPath="/dashboard">
        <h1>Dashboard</h1>
      </Shell01>,
    );
    await expectNoA11yViolations(container);
  });
});

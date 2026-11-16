import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Shell02 } from '@/components/blocks/shell-02';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('Shell02', () => {
  it('renders the brand, the top navigation and the page in a container', () => {
    renderWithLocale(
      <Shell02 currentPath="/customers" width="lg">
        <h1>Page content</h1>
      </Shell02>,
    );
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(nav).getByRole('link', { name: 'Customers' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByText('SAS Suite')).toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(main.className).toContain('max-w-5xl');
    expect(within(main).getByRole('heading', { name: 'Page content' })).toBeInTheDocument();
  });

  it('opens a group as a dropdown submenu', async () => {
    const onNavigate = vi.fn();
    renderWithLocale(
      <Shell02 currentPath="/" onNavigate={onNavigate}>
        <p>content</p>
      </Shell02>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Projects' }));
    const item = await screen.findByRole('menuitem', { name: 'Archived' });
    item.addEventListener('click', (event) => event.preventDefault());
    await userEvent.click(item);
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: 'projects-archived' }));
  });

  it('opens the mobile menu in a sheet and closes it after navigating', async () => {
    const onNavigate = vi.fn();
    renderWithLocale(
      <Shell02 currentPath="/" onNavigate={onNavigate}>
        <p>content</p>
      </Shell02>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const dialog = await screen.findByRole('dialog');
    const link = within(dialog).getByRole('link', { name: /^Invoices/ });
    link.addEventListener('click', (event) => event.preventDefault());
    await userEvent.click(link);
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: 'invoices' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('opens search with Ctrl+K and wires the account menu', async () => {
    const onSignOut = vi.fn();
    renderWithLocale(
      <Shell02 onSignOut={onSignOut}>
        <p>content</p>
      </Shell02>,
    );
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(await screen.findByRole('combobox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Account menu for Layla Hassan' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('renders Arabic labels', () => {
    renderWithLocale(
      <Shell02 currentPath="/customers">
        <p>content</p>
      </Shell02>,
      { locale: 'ar' },
    );
    expect(screen.getByRole('link', { name: 'العملاء' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'فتح قائمة التنقل' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'قائمة حساب ليلى حسن' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(
      <Shell02 currentPath="/dashboard">
        <h1>Dashboard</h1>
      </Shell02>,
    );
    await expectNoA11yViolations(container);
  });
});

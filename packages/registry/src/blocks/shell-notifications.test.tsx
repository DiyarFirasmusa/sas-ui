import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ShellNotifications } from '@/components/blocks/shell-notifications';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const items = [
  { id: 'a', title: 'Invoice paid', description: 'In full', time: '5 min ago' },
  { id: 'b', title: 'Weekly report', read: true },
];

describe('ShellNotifications', () => {
  it('names the bell with the unread count and shows the badge', () => {
    renderWithLocale(<ShellNotifications notifications={items} />);
    expect(screen.getByRole('button', { name: 'Notifications, 1 unread' })).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('hides the badge when everything is read and caps large counts', () => {
    const { rerender } = renderWithLocale(<ShellNotifications notifications={[]} />);
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="shell-notifications-badge"]')).toBeNull();
    rerender(<ShellNotifications count={120} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('lists notifications, selects one and marks all as read', async () => {
    const onSelect = vi.fn();
    const onMarkAllRead = vi.fn();
    renderWithLocale(
      <ShellNotifications
        notifications={items}
        onSelect={onSelect}
        onMarkAllRead={onMarkAllRead}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Notifications/ }));
    await userEvent.click(await screen.findByRole('button', { name: /Invoice paid/ }));
    expect(onSelect).toHaveBeenCalledWith(items[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));
    expect(onMarkAllRead).toHaveBeenCalledOnce();
  });

  it('shows an empty message', async () => {
    renderWithLocale(<ShellNotifications />);
    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(await screen.findByText('You are all caught up.')).toBeInTheDocument();
  });

  it('renders Arabic labels', () => {
    renderWithLocale(<ShellNotifications notifications={items} />, { locale: 'ar' });
    expect(screen.getByRole('button', { name: 'الإشعارات، 1 غير مقروء' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(<ShellNotifications notifications={items} />);
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button'));
    await screen.findByText('Weekly report');
    await expectNoA11yViolations(document.body);
  });
});

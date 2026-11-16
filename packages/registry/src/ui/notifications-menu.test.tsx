import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NotificationsMenu, type NotificationItem } from '@/components/ui/notifications-menu';
import { TopbarContext, type TopbarVariant } from '@/components/ui/topbar';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const items: NotificationItem[] = [
  { id: 'a', title: 'Invoice paid', description: 'In full', time: '5 min ago' },
  { id: 'b', title: 'Weekly report', read: true },
];

function menu(
  props: Partial<React.ComponentProps<typeof NotificationsMenu>> = {},
  variant: TopbarVariant = 'sidebar',
  locale: 'en' | 'ar' = 'en',
) {
  return renderWithLocale(
    <TopbarContext value={variant}>
      <NotificationsMenu notifications={items} {...props} />
    </TopbarContext>,
    { locale },
  );
}

describe('NotificationsMenu', () => {
  it('names the bell with the unread count and shows it beside the icon', () => {
    menu();
    const bell = screen.getByRole('button', { name: 'Notifications, 1 unread' });
    expect(bell).toHaveClass('min-h-11', 'rounded-lg');
    expect(within(bell).getByText('1')).toHaveAttribute('data-slot', 'notifications-count');
  });

  it('hides the count when everything is read and caps large counts', () => {
    const { unmount } = menu({ notifications: [] });
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="notifications-count"]')).toBeNull();
    unmount();
    menu({ count: 120 });
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('floats the count as a danger badge on the hr icon button', () => {
    menu({}, 'hr');
    expect(screen.getByRole('button')).toHaveClass('size-9');
    expect(document.querySelector('[data-slot="notifications-count"]')).toHaveClass(
      'bg-danger',
      'absolute',
    );
  });

  it('lists unread items tinted with a dot, selects one and marks all as read', async () => {
    const onSelect = vi.fn();
    const onMarkAllRead = vi.fn();
    menu({ onSelect, onMarkAllRead });
    await userEvent.click(screen.getByRole('button', { name: /Notifications/ }));
    expect(await screen.findByText('Notifications (1 unread)')).toBeInTheDocument();
    const unread = await screen.findByRole('button', { name: /Invoice paid/ });
    expect(unread).toHaveAttribute('data-unread');
    expect(unread).toHaveClass('bg-primary-light');
    expect(screen.getByRole('button', { name: /Weekly report/ })).not.toHaveAttribute(
      'data-unread',
    );
    await userEvent.click(unread);
    expect(onSelect).toHaveBeenCalledWith(items[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));
    expect(onMarkAllRead).toHaveBeenCalledOnce();
  });

  it('disables mark-all while the request runs', async () => {
    menu({ onMarkAllRead: () => {}, markingAllRead: true });
    await userEvent.click(screen.getByRole('button', { name: /Notifications/ }));
    expect(await screen.findByRole('button', { name: 'Mark all as read' })).toBeDisabled();
  });

  it('shows an empty message, a loading state and an error with retry', async () => {
    const onRetry = vi.fn();
    const empty = menu({ notifications: [] });
    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(await screen.findByText('You are all caught up.')).toBeInTheDocument();
    empty.unmount();

    const loading = menu({ loading: true });
    await userEvent.click(screen.getByRole('button', { name: /Notifications/ }));
    expect(
      await screen.findByRole('status', { name: 'Loading notifications' }),
    ).toBeInTheDocument();
    loading.unmount();

    menu({ error: true, onRetry });
    await userEvent.click(screen.getByRole('button', { name: /Notifications/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Notifications could not be loaded.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders Arabic labels', async () => {
    menu({}, 'sidebar', 'ar');
    const bell = screen.getByRole('button', { name: 'الإشعارات، 1 غير مقروء' });
    await userEvent.click(bell);
    expect(await screen.findByText('الإشعارات (1 غير مقروء)')).toBeInTheDocument();
  });

  it('has no axe violations closed, open and in every state', async () => {
    const { container } = menu();
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button'));
    await screen.findByText('Weekly report');
    await expectNoA11yViolations(document.body);
  });
});

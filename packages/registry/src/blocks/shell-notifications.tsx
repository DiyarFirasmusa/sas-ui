import {
  NotificationsMenu,
  type NotificationItem,
  type NotificationsMenuProps,
} from '@/components/ui/notifications-menu';

type ShellNotification = NotificationItem;
type ShellNotificationsProps = NotificationsMenuProps;

/**
 * Bell with an unread-count badge that opens the latest notifications. A thin
 * name for `NotificationsMenu`, so the shell blocks keep one import for their
 * parts; it dresses to the surrounding `Topbar`.
 */
function ShellNotifications(props: ShellNotificationsProps) {
  return <NotificationsMenu {...props} />;
}

export { ShellNotifications };
export type { ShellNotification, ShellNotificationsProps };

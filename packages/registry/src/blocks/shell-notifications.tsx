import { BellIcon } from '@/components/blocks/block-icons';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { fillTemplate } from '@/lib/format-message';
import { useLabels, type Messages } from '@/lib/locale';
import { formatBadge } from '@/lib/nav-utils';
import { cn } from '@/lib/utils';

const messages: Messages<'notifications' | 'withCount' | 'empty' | 'markAllRead' | 'unread'> = {
  en: {
    notifications: 'Notifications',
    withCount: 'Notifications, {count} unread',
    empty: 'You are all caught up.',
    markAllRead: 'Mark all as read',
    unread: 'Unread',
  },
  ar: {
    notifications: 'الإشعارات',
    withCount: 'الإشعارات، {count} غير مقروء',
    empty: 'لا توجد إشعارات جديدة.',
    markAllRead: 'تعليم الكل كمقروء',
    unread: 'غير مقروء',
  },
};

interface ShellNotification {
  id: string;
  title: string;
  description?: string;
  /** Display text such as "5 min ago"; the app formats it. */
  time?: string;
  read?: boolean;
}

interface ShellNotificationsProps {
  notifications?: readonly ShellNotification[];
  /** Overrides the badge when the total is known server-side. Defaults to the unread count. */
  count?: number;
  onSelect?: (notification: ShellNotification) => void;
  onMarkAllRead?: () => void;
  labels?: Partial<Record<keyof (typeof messages)['en'], string>>;
  className?: string;
}

/** Bell with an unread-count badge that opens the latest notifications. */
function ShellNotifications({
  notifications = [],
  count,
  onSelect,
  onMarkAllRead,
  labels: overrides,
  className,
}: ShellNotificationsProps) {
  const labels = useLabels(messages, overrides);
  const unread = count ?? notifications.filter((item) => item.read !== true).length;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            data-slot="shell-notifications"
            aria-label={
              unread > 0
                ? fillTemplate(labels.withCount, { count: formatBadge(unread) })
                : labels.notifications
            }
            className={cn('relative max-sm:size-11', className)}
          />
        }
      >
        <BellIcon className="size-5" />
        {unread > 0 ? (
          <span
            aria-hidden="true"
            data-slot="shell-notifications-badge"
            dir="ltr"
            className="bg-danger text-danger-foreground text-label rounded-pill absolute end-0.5 top-0.5 inline-flex min-w-4 items-center justify-center px-1 tabular-nums"
          >
            {formatBadge(unread)}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="gap-inline border-stroke px-row py-inline flex items-center justify-between border-b">
          <PopoverTitle>{labels.notifications}</PopoverTitle>
          {onMarkAllRead && unread > 0 ? (
            <Button type="button" variant="link" size="xs" onClick={onMarkAllRead}>
              {labels.markAllRead}
            </Button>
          ) : null}
        </div>
        {notifications.length === 0 ? (
          <p className="text-b2 text-text-muted px-row py-panel text-center">{labels.empty}</p>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {notifications.map((item) => (
              <li key={item.id} className="border-stroke border-b last:border-b-0">
                <button
                  type="button"
                  onClick={() => onSelect?.(item)}
                  className="gap-inline px-row py-inline hover:bg-hover-row focus-visible:ring-ring flex min-h-11 w-full items-start text-start outline-none focus-visible:ring-2 focus-visible:ring-inset"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-1.5 size-2 shrink-0 rounded-full',
                      item.read === true ? 'bg-transparent' : 'bg-primary',
                    )}
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span dir="auto" className="text-b1 text-text-primary">
                      {item.read === true ? null : (
                        <span className="sr-only">{labels.unread}: </span>
                      )}
                      {item.title}
                    </span>
                    {item.description ? (
                      <span dir="auto" className="text-b2 text-text-secondary">
                        {item.description}
                      </span>
                    ) : null}
                    {item.time ? (
                      <span className="text-b3 text-text-muted">{item.time}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { ShellNotifications };
export type { ShellNotification, ShellNotificationsProps };

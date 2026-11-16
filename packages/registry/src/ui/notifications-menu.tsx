import { Button } from '@/components/ui/button';
import { CheckIcon } from '@/components/ui/icons';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { topbarChip, useTopbarVariant } from '@/components/ui/topbar';
import { BellIcon } from '@/components/ui/topbar-icons';
import { fillTemplate } from '@/lib/format-message';
import { useLabels, type Messages } from '@/lib/locale';
import { formatBadge } from '@/lib/nav-utils';
import { cn } from '@/lib/utils';

const messages: Messages<
  | 'notifications'
  | 'withCount'
  | 'titleWithUnread'
  | 'empty'
  | 'markAllRead'
  | 'unread'
  | 'loading'
  | 'error'
  | 'retry'
> = {
  en: {
    notifications: 'Notifications',
    withCount: 'Notifications, {count} unread',
    titleWithUnread: 'Notifications ({count} unread)',
    empty: 'You are all caught up.',
    markAllRead: 'Mark all as read',
    unread: 'Unread',
    loading: 'Loading notifications',
    error: 'Notifications could not be loaded.',
    retry: 'Try again',
  },
  ar: {
    notifications: 'الإشعارات',
    withCount: 'الإشعارات، {count} غير مقروء',
    titleWithUnread: 'الإشعارات ({count} غير مقروء)',
    empty: 'لا توجد إشعارات جديدة.',
    markAllRead: 'تعليم الكل كمقروء',
    unread: 'غير مقروء',
    loading: 'جارٍ تحميل الإشعارات',
    error: 'تعذّر تحميل الإشعارات.',
    retry: 'أعد المحاولة',
  },
};

interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  /** Display text such as "5 min ago"; the app formats it. */
  time?: string;
  read?: boolean;
}

interface NotificationsMenuProps {
  notifications?: readonly NotificationItem[];
  /** Overrides the badge when the total is known server-side. Defaults to the unread count. */
  count?: number;
  /** Shows skeleton rows in the list. */
  loading?: boolean;
  /** Shows an error with a retry button in the list. */
  error?: boolean;
  onRetry?: () => void;
  onSelect?: (notification: NotificationItem) => void;
  onMarkAllRead?: () => void;
  /** Disables "mark all as read" while the request runs. */
  markingAllRead?: boolean;
  labels?: Partial<Record<keyof (typeof messages)['en'], string>>;
  className?: string;
}

function NotificationRow({
  item,
  unreadLabel,
  onSelect,
}: {
  item: NotificationItem;
  unreadLabel: string;
  onSelect?: (notification: NotificationItem) => void;
}) {
  const unread = item.read !== true;
  return (
    <button
      type="button"
      data-unread={unread || undefined}
      onClick={() => onSelect?.(item)}
      className={cn(
        'flex min-h-11 w-full items-start gap-inline rounded-lg p-inline text-start transition-colors outline-none',
        'hover:bg-hover-row focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-highlight',
        unread && 'bg-primary-light hover:bg-primary-light',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'mt-1.5 size-2 shrink-0 rounded-full',
          unread ? 'bg-primary-highlight' : 'bg-transparent',
        )}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        {item.time ? (
          <span className="flex justify-end">
            <span className="text-b3 text-text-muted shrink-0 tabular-nums">{item.time}</span>
          </span>
        ) : null}
        <span dir="auto" className={cn('text-text-primary', unread ? 'text-h5' : 'text-b2')}>
          {unread ? <span className="sr-only">{unreadLabel}: </span> : null}
          {item.title}
        </span>
        {item.description ? (
          <span dir="auto" className="text-b3 text-text-secondary line-clamp-2">
            {item.description}
          </span>
        ) : null}
      </span>
    </button>
  );
}

/**
 * Bell in the top bar with an unread count; opens a popover of the latest
 * notifications (unread ones tinted, with a dot), a "mark all as read" button
 * and designed loading, error and empty states. It dresses to the surrounding
 * `Topbar` variant.
 */
function NotificationsMenu({
  notifications = [],
  count,
  loading = false,
  error = false,
  onRetry,
  onSelect,
  onMarkAllRead,
  markingAllRead = false,
  labels: overrides,
  className,
}: NotificationsMenuProps) {
  const labels = useLabels(messages, overrides);
  const variant = useTopbarVariant();
  const unread = count ?? notifications.filter((item) => item.read !== true).length;
  const shown = formatBadge(unread);

  return (
    <Popover>
      <PopoverTrigger
        data-slot="notifications-menu"
        aria-label={
          unread > 0 ? fillTemplate(labels.withCount, { count: shown }) : labels.notifications
        }
        className={cn(topbarChip(variant, 'icon'), className)}
      >
        <BellIcon className="size-4.5" />
        {unread > 0 ? (
          <span
            aria-hidden="true"
            data-slot="notifications-count"
            dir="ltr"
            className={cn(
              'tabular-nums',
              variant === 'hr' &&
                'pointer-events-none absolute end-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-pill bg-danger px-[3px] text-[9px] leading-4 font-semibold text-danger-foreground',
            )}
          >
            {shown}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        positionMethod="fixed"
        data-slot="notifications-popup"
        className="shadow-mid flex max-h-[min(32rem,var(--available-height))] w-[min(22.5rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg p-0"
      >
        <div className="gap-inline border-stroke-subtle px-row py-inline flex flex-col items-start border-b">
          <PopoverTitle className="text-h4">
            {unread > 0
              ? fillTemplate(labels.titleWithUnread, { count: shown })
              : labels.notifications}
          </PopoverTitle>
          {onMarkAllRead && unread > 0 ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={markingAllRead}
              onClick={onMarkAllRead}
            >
              <CheckIcon />
              {labels.markAllRead}
            </Button>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div
              role="status"
              aria-label={labels.loading}
              className="gap-field p-inline flex flex-col"
            >
              {[0, 1, 2].map((row) => (
                <div key={row} className="gap-field flex flex-col">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-40" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div
              role="alert"
              className="gap-inline px-row py-panel flex flex-col items-center text-center"
            >
              <p className="text-b2 text-text-secondary">{labels.error}</p>
              {onRetry ? (
                <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                  {labels.retry}
                </Button>
              ) : null}
            </div>
          ) : notifications.length === 0 ? (
            <p className="px-row py-panel text-b2 text-text-muted text-center">{labels.empty}</p>
          ) : (
            <ul className="flex flex-col gap-1 p-1">
              {notifications.map((item) => (
                <li key={item.id}>
                  <NotificationRow item={item} unreadLabel={labels.unread} onSelect={onSelect} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { NotificationsMenu };
export type { NotificationItem, NotificationsMenuProps };

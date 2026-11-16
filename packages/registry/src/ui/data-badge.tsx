import type { ReactNode } from 'react';
import { Badge, type BadgeProps } from '@/components/ui/badge';

type BadgeTone = NonNullable<BadgeProps['tone']>;

interface DataBadgeStatus {
  tone: BadgeTone;
  label: ReactNode;
}

interface DataBadgeProps extends Omit<BadgeProps, 'tone' | 'children'> {
  /** The raw backend value, e.g. `"PENDING"`, `2` or `true`. */
  value: string | number | boolean | null | undefined;
  /** Maps each backend value (as a string) to a tone and a display label. */
  statusMap: Record<string, DataBadgeStatus>;
  /** Shown when `value` is null, undefined or an empty string. */
  emptyLabel?: ReactNode;
}

/**
 * Turns a backend enum into a status badge: a small dot and the status text
 * in the tone colour, the way the dashboards' tables show it. Pass
 * `dot={false}` for a tinted chip instead. Values the map does not know
 * render as a neutral badge with the raw value, so a new backend status is
 * visible (not blank) before the front end learns about it.
 */
function DataBadge({
  value,
  statusMap,
  emptyLabel = '—',
  size = 'sm',
  dot = true,
  ...props
}: DataBadgeProps) {
  if (value === null || value === undefined || value === '') {
    return (
      <Badge data-slot="data-badge" tone="neutral" size={size} dot={dot} {...props}>
        {emptyLabel}
      </Badge>
    );
  }
  const key = String(value);
  // hasOwn: a backend value such as "constructor" must not resolve to Object.prototype.
  const status = Object.hasOwn(statusMap, key) ? statusMap[key] : undefined;
  return (
    <Badge
      data-slot="data-badge"
      data-value={key}
      tone={status?.tone ?? 'neutral'}
      size={size}
      dot={dot}
      {...props}
    >
      {status?.label ?? key}
    </Badge>
  );
}

export { DataBadge };
export type { DataBadgeProps, DataBadgeStatus };

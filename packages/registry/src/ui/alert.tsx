import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  CloseIcon,
  InfoIcon,
  XCircleIcon,
} from '@/components/ui/icons';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';
import { variants, type VariantProps } from '@/lib/variants';

const messages: Messages<'dismiss'> = {
  en: { dismiss: 'Dismiss' },
  ar: { dismiss: 'إغلاق التنبيه' },
};

const alertVariants = variants(
  'relative flex w-full items-start gap-inline rounded-xl border p-row text-start text-text-primary',
  {
    variants: {
      variant: {
        info: 'border-tag-cyan/30 bg-tag-cyan-container [&_[data-slot=alert-icon]]:text-tag-cyan',
        success:
          'border-tag-green/30 bg-tag-green-container [&_[data-slot=alert-icon]]:text-tag-green',
        warning:
          'border-tag-yellow/30 bg-tag-yellow-container [&_[data-slot=alert-icon]]:text-tag-yellow',
        danger: 'border-tag-red/30 bg-tag-red-container [&_[data-slot=alert-icon]]:text-tag-red',
      },
    },
    defaultVariants: { variant: 'info' },
  },
);

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>['variant']>;

const ICONS: Record<AlertVariant, typeof InfoIcon> = {
  info: InfoIcon,
  success: CheckCircleIcon,
  warning: AlertTriangleIcon,
  danger: XCircleIcon,
};

interface AlertProps
  extends Omit<React.ComponentProps<'div'>, 'title'>, VariantProps<typeof alertVariants> {
  title?: ReactNode;
  /** Body text. `children` is rendered after it for richer content. */
  description?: ReactNode;
  /** Replaces the variant icon; pass `null` to hide it. */
  icon?: ReactNode;
  /** Inline call to action, e.g. a `<Button size="sm">` or a link. */
  action?: ReactNode;
  /** Shows a dismiss button and calls this when it is pressed. */
  onDismiss?: () => void;
  dismissLabel?: string;
}

/**
 * Inline message. `danger` and `warning` use `role="alert"` so they are
 * announced immediately; `info` and `success` use the polite `role="status"`.
 */
function Alert({
  className,
  variant = 'info',
  title,
  description,
  icon,
  action,
  onDismiss,
  dismissLabel,
  role,
  children,
  ...props
}: AlertProps) {
  const labels = useLabels(messages, dismissLabel ? { dismiss: dismissLabel } : undefined);
  const resolved: AlertVariant = variant ?? 'info';
  const Icon = ICONS[resolved];
  const urgent = resolved === 'danger' || resolved === 'warning';
  const glyph = icon === undefined ? <Icon className="size-5" /> : icon;

  return (
    <div
      data-slot="alert"
      data-variant={resolved}
      role={role ?? (urgent ? 'alert' : 'status')}
      className={cn(alertVariants({ variant: resolved }), className)}
      {...props}
    >
      {glyph === null ? null : (
        <span data-slot="alert-icon" className="mt-0.5 inline-flex shrink-0">
          {glyph}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title ? <p className="text-h5 text-text-primary">{title}</p> : null}
        {description ? <p className="text-b2 text-text-secondary">{description}</p> : null}
        {children}
        {action ? <div className="mt-field gap-field flex flex-wrap">{action}</div> : null}
      </div>
      {onDismiss ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={labels.dismiss}
          onClick={onDismiss}
          className="-m-1 shrink-0"
        >
          <CloseIcon />
        </Button>
      ) : null}
    </div>
  );
}

export { Alert, alertVariants };
export type { AlertProps };

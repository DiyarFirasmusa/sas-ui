import type { ReactNode } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ArrowLeftIcon } from '@/components/ui/icons';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'back'> = {
  en: { back: 'Back' },
  ar: { back: 'رجوع' },
};

interface PageHeaderProps extends Omit<React.ComponentProps<'header'>, 'title'> {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Status chip beside the title, e.g. a `<DataBadge>`. */
  badge?: ReactNode;
  /** Trail above the title, e.g. a breadcrumb. */
  breadcrumb?: ReactNode;
  /** Buttons at the end edge. They wrap under the title on narrow screens. */
  actions?: ReactNode;
  /** Shows a back button that calls this. */
  onBack?: () => void;
  /** Shows a back link to this URL (used when `onBack` is not set). */
  backHref?: string;
  /** Accessible name of the back control; defaults to "Back". */
  backLabel?: string;
  /** Keeps the header pinned to the top of the scroll container. */
  sticky?: boolean;
}

/**
 * Page title row. The back arrow is a mirrored icon, so it points to the
 * start edge in both LTR and RTL.
 */
function PageHeader({
  className,
  title,
  subtitle,
  badge,
  breadcrumb,
  actions,
  onBack,
  backHref,
  backLabel,
  sticky = false,
  ...props
}: PageHeaderProps) {
  const labels = useLabels(messages, backLabel ? { back: backLabel } : undefined);
  const back = onBack ? (
    <Button type="button" variant="outline" size="icon" aria-label={labels.back} onClick={onBack}>
      <ArrowLeftIcon />
    </Button>
  ) : backHref ? (
    <a
      href={backHref}
      aria-label={labels.back}
      className={buttonVariants({ variant: 'outline', size: 'icon' })}
    >
      <ArrowLeftIcon />
    </a>
  ) : null;

  return (
    <header
      data-slot="page-header"
      data-sticky={sticky ? '' : undefined}
      className={cn(
        'flex flex-wrap items-start justify-between gap-row',
        sticky && 'sticky top-0 z-10 border-b border-stroke bg-background/95 py-row backdrop-blur-sm',
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-start gap-inline">
        {back ? <span className="shrink-0">{back}</span> : null}
        <div className="flex min-w-0 flex-col gap-1">
          {breadcrumb}
          <div className="flex flex-wrap items-center gap-inline">
            <h1 className="text-h2 text-text-primary">{title}</h1>
            {badge}
          </div>
          {subtitle ? <p className="text-b2 text-text-secondary">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-field">{actions}</div> : null}
    </header>
  );
}

export { PageHeader };
export type { PageHeaderProps };

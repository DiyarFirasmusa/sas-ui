import type { ReactNode } from 'react';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/** `destructive` is an alias of `danger`. */
type DialogIconTone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'destructive';

/** `inline`: icon beside the title. `stacked`: icon above it. */
type DialogIconLayout = 'inline' | 'stacked';

const TILE_TONE: Record<DialogIconTone, string> = {
  brand: 'bg-primary-light text-primary-text',
  success: 'bg-tag-green-container text-tag-green',
  warning: 'bg-tag-orange-container text-tag-orange',
  danger: 'bg-tag-red-container text-tag-red',
  info: 'bg-tag-blue-container text-tag-blue',
  destructive: 'bg-tag-red-container text-tag-red',
};

const GLYPH_TONE: Record<DialogIconTone, string> = {
  brand: 'text-primary-text',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  destructive: 'text-danger',
};

interface DialogIconProps {
  icon: ReactNode;
  tone?: DialogIconTone;
}

/** Tinted icon tile, for headers that sit outside a dialog (sheets, panels). */
function DialogIconTile({ icon, tone = 'brand' }: DialogIconProps) {
  return (
    <span
      data-slot="dialog-icon-tile"
      aria-hidden="true"
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-xl [&>svg]:size-5',
        TILE_TONE[tone],
      )}
    >
      {icon}
    </span>
  );
}

/** Bare glyph in the tone colour, as the dashboards' dialogs draw it (no tile). */
function DialogIcon({ icon, tone = 'brand' }: DialogIconProps) {
  return (
    <span
      data-slot="dialog-icon"
      data-tone={tone}
      aria-hidden="true"
      className={cn(
        'inline-flex size-6 shrink-0 items-center justify-center [&>svg]:size-5',
        GLYPH_TONE[tone],
      )}
    >
      {icon}
    </span>
  );
}

interface DialogHeadingProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Default `success`; `ConfirmDialog` passes `danger` for destructive confirmations. */
  iconTone?: DialogIconTone;
  iconLayout?: DialogIconLayout;
  /** Keep room at the end edge for the corner close button. */
  reserveClose?: boolean;
}

/** Dialog header with an optional glyph beside or above the title and subtitle. */
function DialogHeading({
  title,
  description,
  icon,
  iconTone = 'success',
  iconLayout = 'inline',
  reserveClose = false,
}: DialogHeadingProps) {
  return (
    <DialogHeader
      reserveClose={reserveClose}
      data-icon-layout={icon ? iconLayout : undefined}
      className={cn(
        icon && iconLayout === 'inline' && 'flex-row items-start gap-inline',
        icon && iconLayout === 'stacked' && 'gap-row',
      )}
    >
      {icon ? <DialogIcon icon={icon} tone={iconTone} /> : null}
      <div className="gap-field flex min-w-0 flex-col">
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </div>
    </DialogHeader>
  );
}

export { DialogHeading, DialogIcon, DialogIconTile };
export type { DialogHeadingProps, DialogIconLayout, DialogIconProps, DialogIconTone };

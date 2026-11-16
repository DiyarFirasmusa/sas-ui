import type { ReactNode } from 'react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import {
  CheckCircleIcon,
  CloseIcon,
  DownloadIcon,
  EyeIcon,
  FileIcon,
  TrashIcon,
} from '@/components/ui/icons';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'download' | 'remove' | 'view'> = {
  en: { download: 'Download', remove: 'Remove', view: 'View' },
  ar: { download: 'تنزيل', remove: 'إزالة', view: 'عرض' },
};

const UNITS = ['B', 'KB', 'MB', 'GB'] as const;

/** 1536 → "1.5 KB". Latin digits in every locale so sizes line up in tables. */
function formatFileSize(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(value);
  return `${formatted} ${UNITS[unit]}`;
}

type AttachmentLabel = 'download' | 'remove' | 'view';

interface AttachmentCardProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  name: string;
  /** Size in bytes. */
  size?: number;
  /** Secondary line, e.g. uploader and date. */
  meta?: ReactNode;
  icon?: ReactNode;
  onDownload?: () => void;
  onRemove?: () => void;
  labels?: Partial<Record<AttachmentLabel, string>>;
  /**
   * An image, canvas or placeholder. With it the card is the dashboards' grid
   * card: a 4:3 preview above a footer with the type tag and `meta`.
   */
  preview?: ReactNode;
  /** Type tag in the footer of a preview card, e.g. "ID card". */
  typeLabel?: string;
  typeTone?: BadgeProps['tone'];
  /** Preview card: makes the preview a toggle button (radio-like selection). */
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  /** Preview card: shows a view button over the preview on hover and focus. */
  onView?: () => void;
}

// The 32px square action the dashboards draw over a preview.
const previewAction =
  'pointer-events-auto inline-flex size-8 cursor-pointer items-center justify-center rounded-control bg-surface text-text-primary outline-none focus-visible:outline-2 focus-visible:outline-primary-highlight [&>svg]:size-4';

// A row action: 32px, transparent, hover tint.
const rowAction =
  'inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-control text-text-secondary outline-none transition-colors hover:bg-hover-row hover:text-text-primary focus-visible:outline-2 focus-visible:outline-primary-highlight motion-reduce:transition-none [&>svg]:size-4';

/**
 * One uploaded file. By default a row: icon, name, size and optional
 * download/remove actions. Pass `preview` for the grid card with a preview
 * area, a type tag and hover actions.
 */
function AttachmentCard({
  name,
  size,
  meta,
  icon,
  onDownload,
  onRemove,
  labels: overrides,
  preview,
  typeLabel,
  typeTone = 'cyan',
  selectable = false,
  selected = false,
  onSelect,
  onView,
  className,
  ...props
}: AttachmentCardProps) {
  const labels = useLabels(messages, overrides);
  const sizeText =
    size === undefined ? null : (
      <span dir="ltr" className="tabular-nums">
        {formatFileSize(size)}
      </span>
    );

  if (preview !== undefined) {
    const hasActions = onView || onRemove || onDownload;
    return (
      <div
        data-slot="attachment-card"
        data-variant="preview"
        data-selected={selected ? '' : undefined}
        className={cn(
          'group/attachment relative flex flex-col gap-field overflow-hidden rounded-[var(--radius-kpi,16px)] border bg-surface p-field transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none',
          selected
            ? 'border-primary-highlight shadow-[0_0_0_1px_var(--primary-highlight)]'
            : 'border-stroke',
          className,
        )}
        {...props}
      >
        <div className="rounded-control relative aspect-4/3 overflow-hidden bg-neutral-100 [&>canvas]:size-full [&>canvas]:object-cover [&>img]:size-full [&>img]:object-cover [&>svg]:size-full">
          {preview}
          {selectable ? (
            <>
              <button
                type="button"
                aria-pressed={selected}
                aria-label={name}
                disabled={!onSelect}
                onClick={onSelect}
                className="focus-visible:ring-primary-highlight absolute inset-0 cursor-pointer rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-inset disabled:cursor-default"
              />
              <span
                aria-hidden="true"
                className={cn(
                  'pointer-events-none absolute end-field top-field inline-flex size-6 items-center justify-center rounded-pill bg-surface',
                  selected ? 'text-primary-text' : 'text-text-inactive',
                )}
              >
                {selected ? (
                  <CheckCircleIcon className="size-5" />
                ) : (
                  <span className="rounded-pill border-stroke-strong size-4 border" />
                )}
              </span>
            </>
          ) : null}
          {hasActions ? (
            <div className="gap-field bg-scrim p-field pointer-events-none absolute inset-0 flex items-start justify-between opacity-0 transition-opacity duration-150 group-focus-within/attachment:opacity-100 group-hover/attachment:opacity-100 motion-reduce:transition-none">
              {onRemove ? (
                <button
                  type="button"
                  className={cn(previewAction, 'text-danger')}
                  aria-label={`${labels.remove}: ${name}`}
                  onClick={onRemove}
                >
                  <CloseIcon />
                </button>
              ) : (
                <span />
              )}
              <span className="gap-field flex">
                {onDownload ? (
                  <button
                    type="button"
                    className={previewAction}
                    aria-label={`${labels.download}: ${name}`}
                    onClick={onDownload}
                  >
                    <DownloadIcon />
                  </button>
                ) : null}
                {onView ? (
                  <button
                    type="button"
                    className={previewAction}
                    aria-label={`${labels.view}: ${name}`}
                    onClick={onView}
                  >
                    <EyeIcon />
                  </button>
                ) : null}
              </span>
            </div>
          ) : null}
        </div>
        <div className="gap-field flex items-center justify-between">
          {typeLabel ? (
            <Badge tone={typeTone} size="sm" dot>
              {typeLabel}
            </Badge>
          ) : (
            <p className="text-b2 text-text-primary min-w-0 truncate" dir="auto" title={name}>
              {name}
            </p>
          )}
          <span className="gap-x-field text-b3 text-text-secondary flex flex-wrap">
            {sizeText}
            {meta}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      data-slot="attachment-card"
      className={cn(
        'flex items-center gap-inline rounded-[var(--radius-kpi,16px)] border border-stroke bg-surface p-field',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="rounded-control text-primary-text grid size-10 shrink-0 place-items-center bg-neutral-100"
      >
        {icon ?? <FileIcon className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-h5 text-text-primary truncate" dir="auto" title={name}>
          {name}
        </p>
        <p className="gap-x-field text-b3 text-text-secondary flex flex-wrap">
          {sizeText}
          {meta}
        </p>
      </div>
      {onDownload ? (
        <button
          type="button"
          className={rowAction}
          aria-label={`${labels.download}: ${name}`}
          onClick={onDownload}
        >
          <DownloadIcon />
        </button>
      ) : null}
      {onRemove ? (
        <button
          type="button"
          className={cn(rowAction, 'hover:text-danger')}
          aria-label={`${labels.remove}: ${name}`}
          onClick={onRemove}
        >
          <TrashIcon />
        </button>
      ) : null}
    </div>
  );
}

export { AttachmentCard, formatFileSize };
export type { AttachmentCardProps };

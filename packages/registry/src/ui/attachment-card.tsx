import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadIcon, FileIcon, TrashIcon } from '@/components/ui/icons';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'download' | 'remove'> = {
  en: { download: 'Download', remove: 'Remove' },
  ar: { download: 'تنزيل', remove: 'إزالة' },
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

interface AttachmentCardProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  name: string;
  /** Size in bytes. */
  size?: number;
  /** Secondary line, e.g. uploader and date. */
  meta?: ReactNode;
  icon?: ReactNode;
  onDownload?: () => void;
  onRemove?: () => void;
  labels?: Partial<Record<'download' | 'remove', string>>;
}

/** One uploaded file: icon, name, size and optional download/remove actions. */
function AttachmentCard({
  name,
  size,
  meta,
  icon,
  onDownload,
  onRemove,
  labels: overrides,
  className,
  ...props
}: AttachmentCardProps) {
  const labels = useLabels(messages, overrides);
  return (
    <div
      data-slot="attachment-card"
      className={cn(
        'flex items-center gap-inline rounded-lg border border-stroke bg-surface p-inline',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="bg-primary-light text-primary-text grid size-10 shrink-0 place-items-center rounded-lg"
      >
        {icon ?? <FileIcon className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-h5 text-text-primary truncate" dir="auto" title={name}>
          {name}
        </p>
        <p className="gap-x-field text-b3 text-text-muted flex flex-wrap">
          {size === undefined ? null : (
            <span dir="ltr" className="tabular-nums">
              {formatFileSize(size)}
            </span>
          )}
          {meta}
        </p>
      </div>
      {onDownload ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`${labels.download}: ${name}`}
          onClick={onDownload}
        >
          <DownloadIcon />
        </Button>
      ) : null}
      {onRemove ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`${labels.remove}: ${name}`}
          onClick={onRemove}
        >
          <TrashIcon />
        </Button>
      ) : null}
    </div>
  );
}

export { AttachmentCard, formatFileSize };
export type { AttachmentCardProps };

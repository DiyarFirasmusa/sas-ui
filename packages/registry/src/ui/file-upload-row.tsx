import { Button } from '@/components/ui/button';
import { CheckCircleIcon, CloseIcon, FileIcon } from '@/components/ui/icons';
import { usePreviewUrl } from '@/hooks/use-preview-url';
import type { FileUploadLabelKey } from '@/lib/file-upload-messages';
import { formatFileSize, type FileRejectionCode } from '@/lib/file-validation';
import { fillTemplate } from '@/lib/format-message';
import { cn } from '@/lib/utils';

type FileUploadStatus = 'idle' | 'uploading' | 'done' | 'error';

/** What the caller reports about one file; the component never uploads by itself. */
interface FileUploadState {
  status: FileUploadStatus;
  /** 0-100. Leave out for an indeterminate bar. */
  progress?: number;
  /** Shown under the name when `status` is `error`. */
  error?: string;
}

interface FileUploadRowProps {
  file: File;
  state?: FileUploadState;
  rejection?: FileRejectionCode;
  errorText?: string;
  preview: boolean;
  locale: string;
  labels: Record<FileUploadLabelKey, string>;
  removable: boolean;
  onRemove: () => void;
}

function FileUploadRow({
  file,
  state,
  errorText,
  rejection,
  preview,
  locale,
  labels,
  removable,
  onRemove,
}: FileUploadRowProps) {
  const previewUrl = usePreviewUrl(file, preview && !rejection);
  const status = rejection ? 'error' : (state?.status ?? 'idle');
  const message = rejection ? errorText : state?.error;
  const progress = state?.progress;
  const removeTemplate = rejection ? labels.dismiss : labels.remove;
  return (
    <li
      data-slot="file-upload-item"
      data-status={status}
      className={cn(
        'flex items-center gap-field rounded-control border border-stroke bg-surface p-field',
        status === 'error' && 'border-danger',
      )}
    >
      {previewUrl ? (
        <img src={previewUrl} alt="" className="size-10 shrink-0 rounded-md object-cover" />
      ) : (
        <span className="bg-hover-row text-text-muted flex size-10 shrink-0 items-center justify-center rounded-md">
          <FileIcon className="size-5" />
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span dir="auto" className="text-b2 text-text-primary truncate">
          {file.name}
        </span>
        <span className="gap-x-field text-b3 text-text-muted flex flex-wrap items-center">
          <span dir="ltr">{formatFileSize(file.size, { locale })}</span>
          {status === 'uploading' ? <span>{labels.uploading}</span> : null}
          {status === 'done' ? <span className="text-success">{labels.done}</span> : null}
          {status === 'error' && !message ? (
            <span className="text-danger">{labels.failed}</span>
          ) : null}
        </span>
        {status === 'uploading' ? (
          <div
            role="progressbar"
            aria-label={fillTemplate(labels.progress, { name: file.name })}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress === undefined ? undefined : Math.round(progress)}
            className="rounded-pill bg-stroke h-1.5 w-full overflow-hidden"
          >
            <div
              className={cn(
                'h-full rounded-pill bg-primary transition-[width] motion-reduce:transition-none',
                progress === undefined && 'w-1/3 animate-pulse motion-reduce:animate-none',
              )}
              style={
                progress === undefined
                  ? undefined
                  : { width: `${Math.min(100, Math.max(0, progress))}%` }
              }
            />
          </div>
        ) : null}
        {message ? (
          <span role="alert" className="text-b3 text-danger">
            {message}
          </span>
        ) : null}
      </div>
      {status === 'done' ? <CheckCircleIcon className="text-success shrink-0" /> : null}
      {removable ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={fillTemplate(removeTemplate, { name: file.name })}
          onClick={onRemove}
        >
          <CloseIcon />
        </Button>
      ) : null}
    </li>
  );
}

export { FileUploadRow };
export type { FileUploadRowProps, FileUploadState, FileUploadStatus };

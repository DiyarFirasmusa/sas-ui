import { Field as FieldPrimitive } from '@base-ui/react/field';
import {
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type DragEvent,
  type FocusEventHandler,
  type Ref,
} from 'react';
import {
  FileUploadRow,
  type FileUploadState,
  type FileUploadStatus,
} from '@/components/ui/file-upload-row';
import { UploadIcon } from '@/components/ui/icons';
import {
  fileUploadMessages as messages,
  type FileUploadLabelKey,
} from '@/lib/file-upload-messages';
import {
  fileKey,
  formatFileSize,
  validateFiles,
  type FileRejection,
  type FileRejectionCode,
} from '@/lib/file-validation';
import { fillTemplate } from '@/lib/format-message';
import { useLabels, useLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  value?: File[];
  defaultValue?: File[];
  onValueChange?: (files: File[]) => void;
  /** Called with every file refused in a batch, each with its reason. */
  onFilesRejected?: (rejections: FileRejection[]) => void;
  /** Same syntax as `<input accept>`: `.pdf,image/*`. */
  accept?: string;
  /** Bytes, per file. */
  maxSize?: number;
  /** Bytes, per file. */
  minSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  /** Upload progress per file, keyed by `fileKey(file)`. */
  states?: Record<string, FileUploadState>;
  /** Thumbnails for image files. */
  showPreview?: boolean;
  id?: string;
  /** Goes on the hidden file input. Browsers only let the user's own pick fill it, so read files from `onValueChange` in React forms. */
  name?: string;
  disabled?: boolean;
  /** Shows the list, but nothing can be added or removed. */
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  className?: string;
  /** The dropzone button. */
  ref?: Ref<HTMLButtonElement>;
  labels?: Partial<Record<FileUploadLabelKey, string>>;
}

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') {
    ref(node);
  } else if (ref) {
    ref.current = node;
  }
}

/** Keeps the native input in step with the list so a surrounding <form> submits the same files. */
function syncInputFiles(input: HTMLInputElement | null, files: readonly File[]) {
  if (!input) {
    return;
  }
  if (typeof DataTransfer === 'function') {
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    input.files = transfer.files;
  } else {
    input.value = '';
  }
}

const dropzoneClasses = cn(
  'flex w-full cursor-pointer flex-col items-center justify-center gap-field rounded-control border border-dashed border-stroke bg-surface p-panel text-center',
  'transition-colors outline-none motion-reduce:transition-none',
  'hover:bg-hover-row',
  'focus-visible:border-primary-highlight focus-visible:ring-3 focus-visible:ring-primary-highlight/20',
  'data-[dragging]:border-primary-highlight data-[dragging]:bg-primary-light',
  'aria-invalid:border-danger aria-invalid:focus-visible:border-danger aria-invalid:focus-visible:ring-danger/20 data-[invalid]:border-danger',
  'disabled:cursor-not-allowed disabled:bg-disabled-container disabled:text-text-inactive',
  'aria-disabled:cursor-default aria-disabled:hover:bg-surface',
);

/**
 * File picker with a keyboard-operable dropzone (a real button: Enter/Space
 * open the browser dialog), drag-and-drop, per-file validation with localized
 * messages, and a list that shows the upload state you pass in. It never
 * uploads: send files yourself and report progress through `states`.
 */
function FileUpload({
  value,
  defaultValue,
  onValueChange,
  onFilesRejected,
  accept,
  maxSize,
  minSize,
  maxFiles,
  multiple = false,
  states,
  showPreview = false,
  id,
  name,
  disabled = false,
  readOnly = false,
  required,
  invalid,
  onBlur,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  className,
  ref,
  labels: labelOverrides,
}: FileUploadProps) {
  const { locale } = useLocale();
  const labels = useLabels(messages, labelOverrides);
  const [innerFiles, setInnerFiles] = useState<File[]>(defaultValue ?? []);
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const hintId = useId();
  const files = value ?? innerFiles;
  const inert = disabled || readOnly;

  function commit(next: File[]) {
    setInnerFiles(next);
    syncInputFiles(inputRef.current, next);
    onValueChange?.(next);
  }

  function addFiles(incoming: File[]) {
    if (inert || incoming.length === 0) {
      return;
    }
    const result = validateFiles(incoming, files, {
      accept,
      maxSize,
      minSize,
      maxFiles,
      multiple,
    });
    setRejections(result.rejected);
    if (result.rejected.length > 0) {
      onFilesRejected?.(result.rejected);
    }
    if (result.accepted.length > 0) {
      commit(result.files);
    } else {
      syncInputFiles(inputRef.current, files);
    }
  }

  function describe(code: FileRejectionCode): string {
    const size = (bytes: number | undefined) => formatFileSize(bytes ?? 0, { locale });
    switch (code) {
      case 'file-invalid-type':
        return labels.errorInvalidType;
      case 'file-too-large':
        return fillTemplate(labels.errorTooLarge, { size: size(maxSize) });
      case 'file-too-small':
        return fillTemplate(labels.errorTooSmall, { size: size(minSize) });
      case 'too-many-files':
        return fillTemplate(labels.errorTooMany, {
          count: String(multiple ? (maxFiles ?? files.length) : 1),
        });
      case 'duplicate':
        return labels.errorDuplicate;
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  const hints = [
    maxSize === undefined
      ? null
      : fillTemplate(labels.hintMaxSize, { size: formatFileSize(maxSize, { locale }) }),
    multiple && maxFiles !== undefined
      ? fillTemplate(labels.hintMaxFiles, { count: String(maxFiles) })
      : null,
  ].filter((hint): hint is string => hint !== null);

  const renderDropzone = (
    controlProps: ButtonHTMLAttributes<HTMLButtonElement> & {
      name?: string;
      ref?: Ref<HTMLButtonElement>;
    },
  ) => {
    // Field.Control is an input primitive; its input-only props must not reach a button.
    const {
      ref: controlRef,
      defaultValue: _default,
      onChange: _change,
      onBlur: controlBlur,
      name: _name,
      ...buttonProps
    } = controlProps;
    const describedBy =
      [ariaDescribedBy ?? buttonProps['aria-describedby'], hints.length > 0 ? hintId : undefined]
        .filter(Boolean)
        .join(' ') || undefined;
    const labelIds =
      ariaLabelledBy ?? buttonProps['aria-labelledby'] ?? (ariaLabel ? buttonProps.id : undefined);
    return (
      <button
        type="button"
        data-slot="file-upload-dropzone"
        ref={(node) => {
          assignRef(controlRef, node);
          assignRef(ref, node);
        }}
        {...buttonProps}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={labelIds ? `${labelIds} ${titleId}` : undefined}
        aria-describedby={describedBy}
        aria-invalid={invalid || buttonProps['aria-invalid'] || undefined}
        aria-required={required || undefined}
        aria-disabled={readOnly || undefined}
        data-dragging={dragging ? '' : undefined}
        data-readonly={readOnly ? '' : undefined}
        onClick={() => {
          if (!inert) {
            inputRef.current?.click();
          }
        }}
        onBlur={(event) => {
          controlBlur?.(event);
          onBlur?.(event);
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(!inert);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = inert ? 'none' : 'copy';
          setDragging(!inert);
        }}
        onDragLeave={(event) => {
          if (
            !(
              event.relatedTarget instanceof Node &&
              event.currentTarget.contains(event.relatedTarget)
            )
          ) {
            setDragging(false);
          }
        }}
        onDrop={handleDrop}
        className={dropzoneClasses}
      >
        <UploadIcon className="text-text-muted size-6" />
        <span id={titleId} className="text-control-input text-text-primary block">
          {dragging ? labels.dropActive : multiple ? labels.dropMultiple : labels.dropSingle}
        </span>
        {hints.length > 0 ? (
          <span id={hintId} className="text-b3 text-text-muted block">
            {hints.join(' · ')}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div data-slot="file-upload" className={cn('flex w-full flex-col gap-field', className)}>
      <FieldPrimitive.Control id={id} disabled={disabled} render={renderDropzone} />
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={handleInputChange}
      />
      {rejections.length > 0 ? (
        <ul aria-label={labels.rejectedList} className="gap-field flex flex-col">
          {rejections.map((rejection, index) => (
            <FileUploadRow
              key={`${fileKey(rejection.file)}-${rejection.code}-${index}`}
              file={rejection.file}
              rejection={rejection.code}
              errorText={describe(rejection.code)}
              preview={false}
              locale={locale}
              labels={labels}
              removable
              onRemove={() =>
                setRejections((current) => current.filter((entry) => entry !== rejection))
              }
            />
          ))}
        </ul>
      ) : null}
      {files.length > 0 ? (
        <ul aria-label={labels.filesList} className="gap-field flex flex-col">
          {files.map((file) => (
            <FileUploadRow
              key={fileKey(file)}
              file={file}
              state={states?.[fileKey(file)]}
              preview={showPreview}
              locale={locale}
              labels={labels}
              removable={!inert}
              onRemove={() => commit(files.filter((entry) => entry !== file))}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export { FileUpload };
export type { FileUploadLabelKey, FileUploadProps, FileUploadState, FileUploadStatus };

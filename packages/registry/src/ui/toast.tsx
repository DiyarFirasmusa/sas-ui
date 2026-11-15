import type { CSSProperties, ReactNode } from 'react';
import { Toaster as Sonner, toast, type ExternalToast, type ToasterProps } from 'sonner';
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  LoaderIcon,
  XCircleIcon,
} from '@/components/ui/icons';
import { useLabels, useLocale, type Messages } from '@/lib/locale';

const messages: Messages<'notifications' | 'close'> = {
  en: { notifications: 'Notifications', close: 'Close notification' },
  ar: { notifications: 'الإشعارات', close: 'إغلاق الإشعار' },
};

/** Logical placement: `end` is the right edge in LTR and the left edge in RTL. */
type ToastPosition =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end';

type PhysicalPosition = NonNullable<ToasterProps['position']>;

/** sonner only knows physical sides, so the logical choice is resolved per direction. */
function resolvePosition(position: ToastPosition, direction: 'ltr' | 'rtl'): PhysicalPosition {
  if (position === 'top-center' || position === 'bottom-center') {
    return position;
  }
  const vertical = position.startsWith('top') ? 'top' : 'bottom';
  const atEnd = position.endsWith('end');
  const right = direction === 'rtl' ? !atEnd : atEnd;
  return `${vertical}-${right ? 'right' : 'left'}`;
}

type ToasterStyle = CSSProperties & Record<`--${string}`, string>;

/** sonner themes itself through these variables; every one maps to a SAS token. */
const toasterStyle: ToasterStyle = {
  fontFamily: 'var(--font-sans)',
  '--normal-bg': 'var(--surface-elevated)',
  '--normal-text': 'var(--text-primary)',
  '--normal-border': 'var(--stroke)',
  '--success-bg': 'var(--surface-elevated)',
  '--success-text': 'var(--text-primary)',
  '--success-border': 'var(--stroke)',
  '--info-bg': 'var(--surface-elevated)',
  '--info-text': 'var(--text-primary)',
  '--info-border': 'var(--stroke)',
  '--warning-bg': 'var(--surface-elevated)',
  '--warning-text': 'var(--text-primary)',
  '--warning-border': 'var(--stroke)',
  '--error-bg': 'var(--surface-elevated)',
  '--error-text': 'var(--text-primary)',
  '--error-border': 'var(--stroke)',
  '--border-radius': 'var(--radius-xl)',
};

interface ToasterComponentProps
  extends Omit<ToasterProps, 'position' | 'dir' | 'icons' | 'theme' | 'containerAriaLabel'> {
  /** Default `bottom-end`: the bottom-right corner in LTR, bottom-left in RTL. */
  position?: ToastPosition;
  /** Accessible name of the notifications region. */
  label?: string;
  /** Accessible name of each toast's close button (only shown with `closeButton`). */
  closeLabel?: string;
}

/**
 * Mount once near the root of the app, then call `notify` from anywhere.
 * Colours come from the active preset's tokens, so dark mode and presets
 * need no extra configuration.
 */
function Toaster({
  position = 'bottom-end',
  label,
  closeLabel,
  style,
  toastOptions,
  ...props
}: ToasterComponentProps) {
  const { direction } = useLocale();
  const labels = useLabels(messages, {
    ...(label ? { notifications: label } : {}),
    ...(closeLabel ? { close: closeLabel } : {}),
  });
  return (
    <Sonner
      dir={direction}
      position={resolvePosition(position, direction)}
      containerAriaLabel={labels.notifications}
      toastOptions={{ closeButtonAriaLabel: labels.close, ...toastOptions }}
      icons={{
        success: <CheckCircleIcon className="size-5 text-success" />,
        info: <InfoIcon className="size-5 text-info" />,
        warning: <AlertTriangleIcon className="size-5 text-warning" />,
        error: <XCircleIcon className="size-5 text-danger" />,
        loading: <LoaderIcon className="size-5 animate-spin text-text-muted motion-reduce:animate-none" />,
      }}
      style={{ ...toasterStyle, ...style }}
      {...props}
    />
  );
}

interface NotifyPromiseMessages<Data> {
  loading: ReactNode;
  success: ReactNode | ((data: Data) => ReactNode);
  error: ReactNode | ((error: unknown) => ReactNode);
}

/** Typed entry points to the toaster. Each returns the toast id (usable with `dismiss`). */
const notify = {
  success: (message: ReactNode, options?: ExternalToast) => toast.success(message, options),
  error: (message: ReactNode, options?: ExternalToast) => toast.error(message, options),
  warning: (message: ReactNode, options?: ExternalToast) => toast.warning(message, options),
  info: (message: ReactNode, options?: ExternalToast) => toast.info(message, options),
  /**
   * Shows a loading toast that turns into success or error when the promise
   * settles. Returns the same promise, so callers can still await or catch it.
   */
  promise: <Data,>(
    promise: Promise<Data>,
    outcome: NotifyPromiseMessages<Data>,
    options?: Omit<ExternalToast, 'description'>,
  ): Promise<Data> => {
    toast.promise(promise, { ...options, ...outcome });
    return promise;
  },
  dismiss: (id?: number | string) => toast.dismiss(id),
};

export { notify, resolvePosition, Toaster };
export type { NotifyPromiseMessages, ToastPosition, ToasterComponentProps };

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Button } from '@/components/ui/button';
import { CloseIcon } from '@/components/ui/icons';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'close'> = {
  en: { close: 'Close' },
  ar: { close: 'إغلاق' },
};

type DialogSize = 'sm' | 'md' | 'lg' | 'xl';

/** Max widths (420 / 640 / 900 / 1100 px); all still shrink to the viewport on phones. */
const dialogSizes: Record<DialogSize, string> = {
  sm: 'max-w-[26.25rem]',
  md: 'max-w-[40rem]',
  lg: 'max-w-[56.25rem]',
  xl: 'max-w-[68.75rem]',
};

function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

interface DialogContentProps extends DialogPrimitive.Popup.Props {
  /** Show the corner close button. Default true. */
  showCloseButton?: boolean;
  /** Accessible name of the close button; defaults to the localised "Close". */
  closeLabel?: string;
  /** Width step. Omit for the default 32rem panel. */
  size?: DialogSize;
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  closeLabel,
  size,
  ...props
}: DialogContentProps) {
  const labels = useLabels(messages, closeLabel ? { close: closeLabel } : undefined);
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot="dialog-backdrop"
        className={cn(
          'fixed inset-0 z-50 bg-scrim',
          'transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0',
          'motion-reduce:transition-none',
        )}
      />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        data-size={size}
        className={cn(
          'fixed start-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-y-1/2 flex-col',
          'ltr:-translate-x-1/2 rtl:translate-x-1/2',
          'rounded-modal border border-stroke bg-popover text-popover-foreground shadow-xlarge outline-none',
          'transition-[opacity,scale] duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
          'motion-reduce:transition-none',
          size && dialogSizes[size],
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="end-inline top-inline absolute"
                aria-label={labels.close}
              />
            }
          >
            <CloseIcon />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

interface DialogHeaderProps extends React.ComponentProps<'div'> {
  /** Keep room at the end edge for the corner close button (default). `false` when the dialog has none. */
  reserveClose?: boolean;
  /** Drop the built-in padding, for edge-to-edge headers. Default true. */
  padded?: boolean;
}

function DialogHeader({
  className,
  reserveClose = true,
  padded = true,
  ...props
}: DialogHeaderProps) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'flex flex-col gap-1',
        padded && 'p-card pb-row',
        reserveClose ? 'pe-14' : padded && 'pe-card',
        className,
      )}
      {...props}
    />
  );
}

function DialogBody({
  className,
  padded = true,
  ...props
}: React.ComponentProps<'div'> & {
  /** Drop the built-in padding, for edge-to-edge content such as a table. Default true. */
  padded?: boolean;
}) {
  return (
    <div
      data-slot="dialog-body"
      className={cn('min-h-0 flex-1 overflow-y-auto', padded && 'px-card py-2', className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  padded = true,
  ...props
}: React.ComponentProps<'div'> & {
  /** Drop the built-in padding. Default true. */
  padded?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-field sm:flex-row sm:justify-end',
        padded && 'p-card pt-row',
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-h3 text-text-primary', className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-b2 text-text-secondary', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
export type { DialogContentProps, DialogHeaderProps, DialogSize };

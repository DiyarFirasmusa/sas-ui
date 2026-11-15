import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { useRef, useState, type ReactElement, type ReactNode } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLabels, type Messages } from '@/lib/locale';

const messages: Messages<'confirm' | 'cancel' | 'failed'> = {
  en: { confirm: 'Confirm', cancel: 'Cancel', failed: 'Something went wrong. Please try again.' },
  ar: { confirm: 'تأكيد', cancel: 'إلغاء', failed: 'حدث خطأ ما. حاول مرة أخرى.' },
};

interface ConfirmDialogProps {
  open?: DialogPrimitive.Root.Props['open'];
  defaultOpen?: DialogPrimitive.Root.Props['defaultOpen'];
  onOpenChange?: DialogPrimitive.Root.Props['onOpenChange'];
  /** Element that opens the dialog, e.g. `<Button>Delete</Button>`. Omit when controlling `open`. */
  trigger?: ReactElement;
  title: ReactNode;
  description?: ReactNode;
  /** Extra content between the description and the buttons. */
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button; focus starts on Cancel so Enter cannot confirm by accident. */
  destructive?: boolean;
  /**
   * Runs when the user confirms. While a returned promise is pending the
   * confirm button shows its spinner, repeat clicks are ignored and the dialog
   * cannot be dismissed. It closes once the promise resolves; if it rejects it
   * stays open and shows an error so the user can retry.
   */
  onConfirm: () => void | Promise<void>;
  /** Message shown after a failed confirm. Defaults to the rejection's message. */
  error?: ReactNode;
}

function errorMessage(thrown: unknown, fallback: string): string {
  return thrown instanceof Error && thrown.message ? thrown.message : fallback;
}

/**
 * Yes/no confirmation built on `Dialog`. Single-flight: one `onConfirm` runs
 * at a time, however fast the user clicks.
 */
function ConfirmDialog({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  error,
}: ConfirmDialogProps) {
  const labels = useLabels(messages, {
    ...(confirmLabel ? { confirm: confirmLabel } : {}),
    ...(cancelLabel ? { cancel: cancelLabel } : {}),
  });
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  // The ref closes the gap between a click and the re-render that disables the button.
  const inFlight = useRef(false);
  const actions = useRef<DialogPrimitive.Root.Actions | null>(null);
  const cancelButton = useRef<HTMLButtonElement | null>(null);

  const handleOpenChange: NonNullable<DialogPrimitive.Root.Props['onOpenChange']> = (next, details) => {
    if (!next && inFlight.current) {
      details.cancel();
      return;
    }
    if (!next) {
      setFailure(null);
    }
    onOpenChange?.(next, details);
  };

  const confirm = async () => {
    if (inFlight.current) {
      return;
    }
    inFlight.current = true;
    setPending(true);
    setFailure(null);
    try {
      await onConfirm();
      inFlight.current = false;
      setPending(false);
      actions.current?.close();
    } catch (thrown) {
      inFlight.current = false;
      setPending(false);
      setFailure(errorMessage(thrown, labels.failed));
    }
  };

  const shownError = failure === null ? null : (error ?? failure);

  return (
    <Dialog
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={handleOpenChange}
      actionsRef={actions}
    >
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent
        data-destructive={destructive ? '' : undefined}
        showCloseButton={false}
        className="max-w-md"
        initialFocus={destructive ? cancelButton : undefined}
      >
        <DialogHeader className="pe-card">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {shownError || children ? (
          <DialogBody className="flex flex-col gap-row">
            {children}
            {shownError ? <Alert variant="danger" description={shownError} /> : null}
          </DialogBody>
        ) : null}
        <DialogFooter>
          <Button
            ref={cancelButton}
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              actions.current?.close();
            }}
          >
            {labels.cancel}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            loading={pending}
            onClick={() => {
              void confirm();
            }}
          >
            {labels.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ConfirmDialog };
export type { ConfirmDialogProps };

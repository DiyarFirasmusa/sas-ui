import type { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
import { cn } from '@/lib/utils';
import { variants, type VariantProps } from '@/lib/variants';

const messages: Messages<
  'submit' | 'cancel' | 'discardTitle' | 'discardDescription' | 'discard' | 'keepEditing'
> = {
  en: {
    submit: 'Save',
    cancel: 'Cancel',
    discardTitle: 'Discard changes?',
    discardDescription: 'Your unsaved changes will be lost.',
    discard: 'Discard',
    keepEditing: 'Keep editing',
  },
  ar: {
    submit: 'حفظ',
    cancel: 'إلغاء',
    discardTitle: 'تجاهل التغييرات؟',
    discardDescription: 'ستفقد التغييرات غير المحفوظة.',
    discard: 'تجاهل',
    keepEditing: 'متابعة التعديل',
  },
};

const contentVariants = variants('', {
  variants: { size: { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } },
  defaultVariants: { size: 'md' },
});

interface FormDialogProps extends VariantProps<typeof contentVariants> {
  open?: DialogPrimitive.Root.Props['open'];
  defaultOpen?: DialogPrimitive.Root.Props['defaultOpen'];
  onOpenChange?: DialogPrimitive.Root.Props['onOpenChange'];
  /** Element that opens the dialog. Omit when controlling `open`. */
  trigger?: ReactElement;
  title: ReactNode;
  description?: ReactNode;
  /** The form fields. */
  children: ReactNode;
  /**
   * Runs on submit (after `preventDefault`), e.g. `form.handleSubmit(save)`.
   * The dialog never closes by itself: close it (set `open` to false) once
   * the save succeeded, so a failed save keeps the user's input.
   */
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  /** Shows the spinner on the submit button and blocks repeat submits and dismissal. */
  isSubmitting?: boolean;
  /** Form-level failure shown above the fields. */
  error?: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  /** Ask before closing a dialog whose fields were edited. */
  confirmDiscard?: boolean;
  /**
   * Whether the form has unsaved edits. Defaults to "the user typed or changed
   * a native field"; pass react-hook-form's `formState.isDirty` for custom controls.
   */
  isDirty?: boolean;
  className?: string;
}

/** Dialog around a `<form>` with a cancel/submit footer and an optional discard guard. */
function FormDialog({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  onSubmit,
  isSubmitting = false,
  error,
  submitLabel,
  cancelLabel,
  confirmDiscard = false,
  isDirty,
  size,
  className,
}: FormDialogProps) {
  const labels = useLabels(messages, {
    ...(submitLabel ? { submit: submitLabel } : {}),
    ...(cancelLabel ? { cancel: cancelLabel } : {}),
  });
  const [typed, setTyped] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const actions = useRef<DialogPrimitive.Root.Actions | null>(null);
  const dirty = isDirty ?? typed;
  const shouldAsk = confirmDiscard && dirty;

  // Closing from outside (after a successful save) must not leave the next opening "dirty".
  useEffect(() => {
    if (open === false) {
      setTyped(false);
    }
  }, [open]);

  const handleOpenChange: NonNullable<DialogPrimitive.Root.Props['onOpenChange']> = (
    next,
    details,
  ) => {
    if (next) {
      onOpenChange?.(next, details);
      return;
    }
    if (isSubmitting) {
      details.cancel();
      return;
    }
    if (shouldAsk && details.reason !== 'imperative-action') {
      details.cancel();
      setDiscardOpen(true);
      return;
    }
    setTyped(false);
    onOpenChange?.(next, details);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    void onSubmit(event);
  };

  return (
    <>
      <Dialog
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={handleOpenChange}
        actionsRef={actions}
      >
        {trigger ? <DialogTrigger render={trigger} /> : null}
        <DialogContent
          showCloseButton={!isSubmitting}
          className={cn(contentVariants({ size }), className)}
        >
          <form
            data-slot="form-dialog-form"
            aria-busy={isSubmitting || undefined}
            onSubmit={submit}
            onInput={() => {
              setTyped(true);
            }}
            onChange={() => {
              setTyped(true);
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description ? <DialogDescription>{description}</DialogDescription> : null}
            </DialogHeader>
            <DialogBody className="gap-row flex flex-col">
              {error ? <Alert variant="danger" description={error} /> : null}
              {children}
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => {
                  // A real close request, so the discard guard applies to Cancel too.
                  if (shouldAsk) {
                    setDiscardOpen(true);
                  } else {
                    actions.current?.close();
                  }
                }}
              >
                {labels.cancel}
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {labels.submit}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {confirmDiscard ? (
        <ConfirmDialog
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          destructive
          title={labels.discardTitle}
          description={labels.discardDescription}
          confirmLabel={labels.discard}
          cancelLabel={labels.keepEditing}
          onConfirm={() => {
            setTyped(false);
            setDiscardOpen(false);
            actions.current?.close();
          }}
        />
      ) : null}
    </>
  );
}

export { FormDialog };
export type { FormDialogProps };

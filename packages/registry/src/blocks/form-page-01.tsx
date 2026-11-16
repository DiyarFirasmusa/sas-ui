import { useEffect, useRef, useState } from 'react';
import {
  EMPTY_VALUES,
  FIELD_NAMES,
  createSchema,
  demoSubmit,
  messages,
  serverPayload,
  type FormPage01Labels,
  type FormPage01Values,
} from '@/components/blocks/form-page-01-model';
import { FormPage01Sections } from '@/components/blocks/form-page-01-sections';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Form, useZodForm } from '@/components/ui/form';
import { PageHeader } from '@/components/ui/page-header';
import { applyServerErrors } from '@/lib/form-errors';
import { useLabels, useLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';

type FormPage01Status = 'draft' | 'submitted' | 'draftFailed';

interface FormPage01Props extends Omit<React.ComponentProps<'div'>, 'onSubmit' | 'defaultValue'> {
  /** Starting values (an existing record when editing). Anything left out is empty. */
  defaultValues?: Partial<FormPage01Values>;
  /**
   * Called with valid values. Resolve when saved. Reject with the backend's
   * validation response (an object such as `{ errors: { email: ['Taken'] } }`,
   * a string, or an `Error`): fields get their messages, the rest shows above
   * the form. Without this prop a demo server answers after a short wait and
   * refuses `taken@example.com`.
   */
  onSubmit?: (values: FormPage01Values) => void | Promise<void>;
  /** Called with the current values, valid or not. Reject to show a failure notice. */
  onSaveDraft?: (values: FormPage01Values) => void | Promise<void>;
  /** Called to leave the page: Cancel and the back arrow, after the discard confirmation. */
  onCancel?: () => void;
  labels?: Partial<FormPage01Labels>;
}

/**
 * Long create/edit page: six sections, a floating action bar, a draft that
 * skips validation, a single-flight submit, server errors mapped back onto
 * fields, and a guard that asks before throwing away unsaved changes
 * (Cancel, the back arrow, and closing the tab).
 */
function FormPage01({
  defaultValues,
  onSubmit,
  onSaveDraft,
  onCancel,
  labels: overrides,
  className,
  ...props
}: FormPage01Props) {
  const labels = useLabels(messages, overrides);
  const { locale } = useLocale();
  const form = useZodForm(createSchema(labels), {
    defaultValues: { ...EMPTY_VALUES, ...defaultValues },
  });
  const { isDirty, isSubmitting } = form.formState;
  const [status, setStatus] = useState<FormPage01Status | null>(null);
  const [draftPending, setDraftPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // A ref, not state: two clicks in one frame must not start two requests.
  const inFlight = useRef(false);

  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
    };
  }, [isDirty]);

  function leave() {
    if (form.formState.isDirty) {
      setConfirmOpen(true);
    } else {
      onCancel?.();
    }
  }

  async function submit(values: FormPage01Values) {
    if (inFlight.current) {
      return;
    }
    inFlight.current = true;
    setStatus(null);
    try {
      await (onSubmit ? onSubmit(values) : demoSubmit(values, locale));
      form.reset(values);
      setStatus('submitted');
    } catch (thrown) {
      applyServerErrors(form.setError, serverPayload(thrown), {
        fieldNames: FIELD_NAMES,
        fallbackMessage: labels.submitFailed,
      });
    } finally {
      inFlight.current = false;
    }
  }

  async function saveDraft() {
    if (inFlight.current) {
      return;
    }
    inFlight.current = true;
    setDraftPending(true);
    setStatus(null);
    const values = form.getValues();
    try {
      await onSaveDraft?.(values);
      form.reset(values, { keepErrors: true });
      setStatus('draft');
    } catch {
      setStatus('draftFailed');
    } finally {
      inFlight.current = false;
      setDraftPending(false);
    }
  }

  return (
    <div className={cn('min-h-svh bg-background', className)} {...props}>
      <div className="gap-card p-row sm:p-page mx-auto flex w-full max-w-4xl flex-col">
        <PageHeader title={labels.title} subtitle={labels.subtitle} onBack={leave} />
        {status ? (
          <Alert
            variant={status === 'draftFailed' ? 'danger' : 'success'}
            description={
              status === 'draft'
                ? labels.draftSaved
                : status === 'submitted'
                  ? labels.submitted
                  : labels.draftFailed
            }
            onDismiss={() => setStatus(null)}
          />
        ) : null}
        <Form form={form} onSubmit={submit} className="gap-card">
          <FormPage01Sections control={form.control} labels={labels} locale={locale} />
          <div
            data-slot="form-page-actions"
            className="gap-field p-inline bottom-row border-stroke bg-surface shadow-small sticky z-10 flex flex-col-reverse rounded-xl border sm:flex-row sm:items-center"
          >
            <p role="status" className="text-b2 text-text-muted me-auto">
              {isDirty ? labels.unsaved : null}
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || draftPending}
              onClick={leave}
            >
              {labels.cancel}
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={draftPending}
              disabled={isSubmitting}
              onClick={() => {
                void saveDraft();
              }}
            >
              {labels.saveDraft}
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={draftPending}>
              {labels.submit}
            </Button>
          </div>
        </Form>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={labels.discardTitle}
        description={labels.discardDescription}
        confirmLabel={labels.discardConfirm}
        cancelLabel={labels.keepEditing}
        destructive
        onConfirm={() => {
          form.reset();
          onCancel?.();
        }}
      />
    </div>
  );
}

export { FormPage01 };
export type { FormPage01Props, FormPage01Values };

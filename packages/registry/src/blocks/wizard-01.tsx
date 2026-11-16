import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  EMPTY_VALUES,
  FIELD_NAMES,
  STEP_FIELDS,
  createSchema,
  firstStepWith,
  messages,
  serverPayload,
  type Wizard01Labels,
  type Wizard01Values,
} from '@/components/blocks/wizard-01-model';
import { Wizard01Step } from '@/components/blocks/wizard-01-steps';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Form, useZodForm } from '@/components/ui/form';
import { CheckCircleIcon } from '@/components/ui/icons';
import { PageHeader } from '@/components/ui/page-header';
import { Stepper } from '@/components/ui/stepper';
import { applyServerErrors } from '@/lib/form-errors';
import { useLabels, useLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';

/** Horizontal stepper from `md` up (Tailwind's breakpoint), vertical below. */
const WIDE_QUERY = '(min-width: 768px)';

function subscribeWide(notify: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener('change', notify);
  return () => {
    query.removeEventListener('change', notify);
  };
}

function useIsWide() {
  return useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => true,
  );
}

interface Wizard01Props extends Omit<React.ComponentProps<'div'>, 'onSubmit' | 'defaultValue'> {
  /** Starting answers. Anything left out is empty (or the default plan and language). */
  defaultValues?: Partial<Wizard01Values>;
  /**
   * Called once with every answer, from the review step. Resolve when saved.
   * Reject with the backend's validation response (`{ errors: { email: ['Taken'] } }`,
   * a string or an `Error`): the wizard jumps to the first step with a field error.
   */
  onSubmit?: (values: Wizard01Values) => void | Promise<void>;
  /** Called from the confirmation screen's "start over" button, after the form is cleared. */
  onRestart?: () => void;
  labels?: Partial<Wizard01Labels>;
}

/**
 * Four-step form (account, organisation, plan, review). Next validates only
 * the current step's fields; Back and the stepper move backwards without
 * losing answers (future steps are not clickable); the last step summarises
 * everything and submits once. Success replaces the form with a confirmation.
 */
function Wizard01({
  defaultValues,
  onSubmit,
  onRestart,
  labels: overrides,
  className,
  ...props
}: Wizard01Props) {
  const labels = useLabels(messages, overrides);
  const { locale } = useLocale();
  const wide = useIsWide();
  const form = useZodForm(createSchema(labels), {
    defaultValues: { ...EMPTY_VALUES, ...defaultValues },
  });
  const { isSubmitting } = form.formState;
  const [step, setStep] = useState(0);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const confirmation = useRef<HTMLDivElement>(null);

  const stepLabels = [
    { label: labels.accountStep, description: labels.accountDescription },
    { label: labels.organisationStep, description: labels.organisationDescription },
    { label: labels.planStep, description: labels.planDescription },
    { label: labels.reviewStep, description: labels.reviewDescription },
  ];
  const last = stepLabels.length - 1;
  const current = stepLabels[step] ?? stepLabels[0];

  // After a step change keyboard and screen-reader users land on the new heading.
  const moved = useRef(false);
  useEffect(() => {
    if (moved.current) {
      heading.current?.focus();
    }
  }, [step]);
  useEffect(() => {
    if (submittedEmail !== null) {
      confirmation.current?.focus();
    }
  }, [submittedEmail]);

  function goTo(next: number) {
    moved.current = true;
    setStep(next);
  }

  async function goNext() {
    const owned = STEP_FIELDS[step] ?? [];
    if (await form.trigger([...owned], { shouldFocus: true })) {
      goTo(Math.min(step + 1, last));
    }
  }

  async function submit(values: Wizard01Values) {
    if (inFlight.current) {
      return;
    }
    inFlight.current = true;
    try {
      await onSubmit?.(values);
      setSubmittedEmail(values.email);
    } catch (thrown) {
      const { fields } = applyServerErrors(form.setError, serverPayload(thrown), {
        fieldNames: FIELD_NAMES,
        fallbackMessage: labels.submitFailed,
        focus: false,
      });
      const target = firstStepWith(fields);
      if (target !== -1 && target !== step) {
        goTo(target);
      }
    } finally {
      inFlight.current = false;
    }
  }

  // A schema failure on submit (a field of an earlier step) sends the user there.
  function showFirstInvalidStep() {
    const target = firstStepWith(Object.keys(form.formState.errors));
    if (target !== -1) {
      goTo(target);
    }
  }

  function restart() {
    form.reset({ ...EMPTY_VALUES, ...defaultValues });
    moved.current = false;
    setStep(0);
    setSubmittedEmail(null);
    onRestart?.();
  }

  if (submittedEmail !== null) {
    const [doneBefore, doneAfter] = labels.doneDescription.split('{email}');
    return (
      <div className={cn('min-h-svh bg-background p-4 md:p-page', className)} {...props}>
        <div className="mx-auto flex w-full max-w-3xl flex-col">
          <EmptyState
            ref={confirmation}
            tabIndex={-1}
            role="status"
            size="page"
            icon={<CheckCircleIcon className="text-tag-green" />}
            title={labels.doneTitle}
            titleAs="h1"
            description={
              <>
                {doneBefore}
                <span dir="ltr">{submittedEmail}</span>
                {doneAfter}
              </>
            }
            actions={
              <Button type="button" variant="outline" onClick={restart}>
                {labels.startOver}
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-svh bg-background', className)} {...props}>
      <div className="gap-card md:p-page mx-auto flex w-full max-w-3xl flex-col p-4">
        <PageHeader title={labels.title} subtitle={labels.subtitle} />
        <Stepper
          steps={stepLabels.map((item, index) => ({
            label: item.label,
            description: wide ? undefined : item.description,
            // Only finished steps can be revisited; the rest stay locked.
            disabled: index >= step,
          }))}
          current={step}
          orientation={wide ? 'horizontal' : 'vertical'}
          onStepClick={goTo}
          label={labels.stepsLabel}
        />
        <Card>
          <CardContent>
            <Form
              form={form}
              onSubmit={submit}
              onInvalid={showFirstInvalidStep}
              onKeyDown={(event) => {
                // Enter inside a field must mean "Next" until the review step.
                if (
                  event.key === 'Enter' &&
                  !event.defaultPrevented &&
                  step < last &&
                  event.target instanceof HTMLInputElement
                ) {
                  event.preventDefault();
                  void goNext();
                }
              }}
            >
              <div className="flex flex-col gap-1">
                <h2 ref={heading} tabIndex={-1} className="text-h3 text-text-primary outline-none">
                  {current?.label}
                </h2>
                <p className="text-b2 text-text-secondary">{current?.description}</p>
              </div>
              <Wizard01Step
                step={step}
                control={form.control}
                values={form.getValues()}
                labels={labels}
                locale={locale}
                onEdit={goTo}
              />
              <div className="gap-field flex flex-col-reverse sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  disabled={step === 0 || isSubmitting}
                  onClick={() => goTo(step - 1)}
                >
                  {labels.back}
                </Button>
                {step < last ? (
                  <Button
                    type="button"
                    onClick={() => {
                      void goNext();
                    }}
                  >
                    {labels.next}
                  </Button>
                ) : (
                  <Button type="submit" loading={isSubmitting}>
                    {labels.submit}
                  </Button>
                )}
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { Wizard01 };
export type { Wizard01Props, Wizard01Values };

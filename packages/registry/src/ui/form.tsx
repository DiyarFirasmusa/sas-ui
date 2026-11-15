import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import {
  Controller,
  FormProvider,
  useForm,
  type ControllerFieldState,
  type ControllerProps,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type SubmitErrorHandler,
  type SubmitHandler,
  type UseFormProps,
  type UseFormReturn,
  type UseFormStateReturn,
} from 'react-hook-form';
import type { z } from 'zod';
import { Field } from '@/components/ui/field';
import { cn } from '@/lib/utils';

/**
 * `useForm` wired to a zod 4 schema. The form is typed with the schema's input
 * (what the fields hold) and `handleSubmit` receives its output (what the
 * schema parses to). Validates when a field is touched, then on every change.
 */
function useZodForm<TInput extends FieldValues, TOutput>(
  schema: z.ZodType<TOutput, TInput>,
  options: Omit<UseFormProps<TInput, unknown, TOutput>, 'resolver'> = {},
): UseFormReturn<TInput, unknown, TOutput> {
  return useForm<TInput, unknown, TOutput>({
    mode: 'onTouched',
    ...options,
    resolver: zodResolver<TInput, unknown, TOutput>(schema),
  });
}

interface FormProps<TFieldValues extends FieldValues, TContext, TTransformedValues> extends Omit<
  React.ComponentProps<'form'>,
  'onSubmit' | 'onInvalid' | 'children'
> {
  form: UseFormReturn<TFieldValues, TContext, TTransformedValues>;
  /** Receives the validated (and, with `useZodForm`, parsed) values. */
  onSubmit: SubmitHandler<TTransformedValues>;
  onInvalid?: SubmitErrorHandler<TFieldValues>;
  /**
   * Form-level error shown above the fields. Defaults to the message
   * `applyServerErrors` stores at `root.server`.
   */
  error?: ReactNode;
  children: ReactNode;
}

/**
 * `<form>` that provides the react-hook-form context to `FormField`, submits
 * through `form.handleSubmit` and shows a form-level error. Native browser
 * validation is off: the schema is the one source of messages.
 */
function Form<TFieldValues extends FieldValues, TContext, TTransformedValues>({
  form,
  onSubmit,
  onInvalid,
  error,
  className,
  children,
  ...props
}: FormProps<TFieldValues, TContext, TTransformedValues>) {
  const rootMessage = form.formState.errors.root?.server?.message;
  const message = error ?? rootMessage;
  return (
    <FormProvider {...form}>
      <form
        data-slot="form"
        noValidate
        aria-busy={form.formState.isSubmitting || undefined}
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className={cn('flex flex-col gap-row', className)}
        {...props}
      >
        {message ? <FormMessage>{message}</FormMessage> : null}
        {children}
      </form>
    </FormProvider>
  );
}

/** Announced error banner for problems that belong to the whole form. */
function FormMessage({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="form-message"
      role="alert"
      className={cn(
        'rounded-control border border-danger bg-tag-red-container p-inline text-b2 text-tag-red',
        className,
      )}
      {...props}
    />
  );
}

interface FormFieldRenderProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  /** `name`, `value`, `onChange`, `onBlur`, `ref`, `disabled`: spread onto Input, Textarea… */
  field: ControllerRenderProps<TFieldValues, TName>;
  fieldState: ControllerFieldState;
  formState: UseFormStateReturn<TFieldValues>;
}

interface FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> extends Omit<ControllerProps<TFieldValues, TName>, 'render'> {
  label?: ReactNode;
  description?: ReactNode;
  required?: boolean;
  className?: string;
  /** Renders the control. Its error text comes from react-hook-form's state. */
  render: (props: FormFieldRenderProps<TFieldValues, TName>) => ReactNode;
}

/**
 * One form field: a react-hook-form `Controller` that renders the SAS `Field`
 * (label, description, error) around your control. The error is the first
 * message for this field, whether it came from the schema or the server.
 */
function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  label,
  description,
  required,
  className,
  render,
  ...controller
}: FormFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      {...controller}
      render={({ field, fieldState, formState }) => (
        <Field
          name={field.name}
          label={label}
          description={description}
          required={required}
          error={fieldState.error?.message}
          invalid={fieldState.invalid}
          className={className}
        >
          {render({ field, fieldState, formState })}
        </Field>
      )}
    />
  );
}

export { Form, FormField, FormMessage, useZodForm };
export type { FormFieldProps, FormFieldRenderProps, FormProps };

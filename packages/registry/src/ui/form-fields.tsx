import { useId, type ReactNode } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox, type ComboboxProps } from '@/components/ui/combobox';
import { DatePicker, type DatePickerProps } from '@/components/ui/date-picker';
import { FileUpload, type FileUploadProps } from '@/components/ui/file-upload';
import { FormField } from '@/components/ui/form';
import { Input, type InputProps } from '@/components/ui/input';
import { NumberInput, type NumberInputProps } from '@/components/ui/number-input';
import { Select, type SelectOption } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { TimePicker, type TimePickerProps } from '@/components/ui/time-picker';

/**
 * Ready-made react-hook-form fields: `control` + `name` + `label`, the shape
 * the SAS dashboards already use (`<TextField control name label />`). Each is
 * a `FormField` around one library control — read `form.tsx` to build your own
 * (a date range, a tree picker…) in the same few lines.
 */
interface BoundFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> {
  control: Control<TFieldValues>;
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

type TextFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = BoundFieldProps<TFieldValues, TName> &
  Pick<InputProps, 'type' | 'placeholder' | 'autoComplete' | 'maxLength' | 'kind' | 'inputMode'>;

function TextField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  ...inputProps
}: TextFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
      render={({ field, fieldState }) => (
        <Input
          {...inputProps}
          {...field}
          value={field.value ?? ''}
          disabled={disabled ?? field.disabled}
          required={required}
          aria-invalid={fieldState.invalid || undefined}
        />
      )}
    />
  );
}

function TextareaField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  placeholder,
  rows,
}: BoundFieldProps<TFieldValues, TName> & {
  placeholder?: string;
  rows?: number;
}) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
      render={({ field, fieldState }) => (
        <Textarea
          {...field}
          value={field.value ?? ''}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled ?? field.disabled}
          aria-invalid={fieldState.invalid || undefined}
        />
      )}
    />
  );
}

function SelectField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  options,
  placeholder,
}: BoundFieldProps<TFieldValues, TName> & {
  options: readonly SelectOption[];
  placeholder?: ReactNode;
}) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
      render={({ field }) => (
        <Select
          name={field.name}
          options={options}
          placeholder={placeholder}
          value={typeof field.value === 'string' && field.value !== '' ? field.value : null}
          onValueChange={(next) => field.onChange(next ?? '')}
          disabled={disabled ?? field.disabled}
        />
      )}
    />
  );
}

function ComboboxField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  ...comboboxProps
}: BoundFieldProps<TFieldValues, TName> &
  Pick<
    ComboboxProps,
    | 'options'
    | 'fallbackOptions'
    | 'placeholder'
    | 'onSearchChange'
    | 'loading'
    | 'error'
    | 'hasMore'
    | 'onLoadMore'
    | 'onRetry'
  >) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
      render={({ field, fieldState }) => (
        <Combobox
          {...comboboxProps}
          name={field.name}
          ref={field.ref}
          onBlur={field.onBlur}
          value={typeof field.value === 'string' && field.value !== '' ? field.value : null}
          onValueChange={(next) => field.onChange(next ?? '')}
          disabled={disabled ?? field.disabled}
          aria-invalid={fieldState.invalid || undefined}
        />
      )}
    />
  );
}

type NumberFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = BoundFieldProps<TFieldValues, TName> &
  Pick<NumberInputProps, 'min' | 'max' | 'step' | 'placeholder'>;

/** The form value is `number | null` (null while the field is empty). */
function NumberField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  ...numberProps
}: NumberFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
      render={({ field, fieldState }) => (
        <NumberInput
          {...numberProps}
          name={field.name}
          ref={field.ref}
          onBlur={field.onBlur}
          value={typeof field.value === 'number' ? field.value : null}
          onValueChange={(next) => field.onChange(next)}
          disabled={disabled ?? field.disabled}
          aria-invalid={fieldState.invalid || undefined}
        />
      )}
    />
  );
}

/**
 * A settings row: label and description at the start, the switch at the end
 * (the dashboards' `SwitchField`). The text names and describes the switch.
 */
function SwitchField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  label,
  description,
  disabled,
  className,
}: BoundFieldProps<TFieldValues, TName>) {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  return (
    <FormField
      control={control}
      name={name}
      className={className}
      render={({ field }) => (
        <div className="gap-inline flex w-full items-center justify-between">
          <div className="min-w-0 flex-1 space-y-0.5">
            {label ? (
              <span id={labelId} className="text-label text-text-primary block">
                {label}
              </span>
            ) : null}
            {description ? (
              <span id={descriptionId} className="text-b3 text-text-secondary block">
                {description}
              </span>
            ) : null}
          </div>
          <Switch
            name={field.name}
            ref={field.ref}
            aria-labelledby={label ? labelId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            checked={field.value === true}
            onCheckedChange={(next) => field.onChange(next)}
            onBlur={field.onBlur}
            disabled={disabled ?? field.disabled}
          />
        </div>
      )}
    />
  );
}

function CheckboxField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
}: BoundFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      description={description}
      className={className}
      render={({ field, fieldState }) => (
        <label className="gap-field text-control-input text-text-primary flex items-center">
          <Checkbox
            name={field.name}
            ref={field.ref}
            checked={field.value === true}
            onCheckedChange={(next) => field.onChange(next)}
            onBlur={field.onBlur}
            disabled={disabled ?? field.disabled}
            required={required}
            aria-invalid={fieldState.invalid || undefined}
          />
          {label}
        </label>
      )}
    />
  );
}

type DateFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = BoundFieldProps<TFieldValues, TName> &
  Pick<DatePickerProps, 'placeholder' | 'clearable' | 'min' | 'max'>;

/** The form value is an ISO `yyyy-mm-dd` string, or '' while empty. */
function DateField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  ...pickerProps
}: DateFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
      render={({ field, fieldState }) => (
        <DatePicker
          {...pickerProps}
          name={field.name}
          ref={field.ref}
          onBlur={field.onBlur}
          value={typeof field.value === 'string' && field.value !== '' ? field.value : null}
          onValueChange={(next) => field.onChange(next ?? '')}
          disabled={disabled ?? field.disabled}
          aria-invalid={fieldState.invalid || undefined}
        />
      )}
    />
  );
}

type TimeFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = BoundFieldProps<TFieldValues, TName> & Pick<TimePickerProps, 'minuteStep'>;

/** The form value is `HH:mm`, or '' while empty or half-typed. */
function TimeField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  ...timeProps
}: TimeFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
      render={({ field }) => (
        <TimePicker
          {...timeProps}
          name={field.name}
          ref={field.ref}
          onBlur={field.onBlur}
          value={typeof field.value === 'string' && field.value !== '' ? field.value : null}
          onValueChange={(next) => field.onChange(next ?? '')}
          disabled={disabled ?? field.disabled}
        />
      )}
    />
  );
}

type FileFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = BoundFieldProps<TFieldValues, TName> &
  Pick<FileUploadProps, 'accept' | 'maxSize' | 'maxFiles' | 'multiple'>;

/** The form value is a `File[]`. Uploading and progress stay with the caller. */
function FileField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  ...uploadProps
}: FileFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
      render={({ field }) => (
        <FileUpload
          {...uploadProps}
          name={field.name}
          value={Array.isArray(field.value) ? field.value : []}
          onValueChange={(files) => field.onChange(files)}
          disabled={disabled ?? field.disabled}
        />
      )}
    />
  );
}

export {
  CheckboxField,
  ComboboxField,
  DateField,
  FileField,
  NumberField,
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
  TimeField,
};
export type { BoundFieldProps };

import { Field as FieldPrimitive } from '@base-ui/react/field';
import type { ReactNode } from 'react';
import { RequiredMark } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FieldProps extends Omit<FieldPrimitive.Root.Props, 'children'> {
  label?: ReactNode;
  description?: ReactNode;
  /** Error text. Shown (and announced) when set; also marks the control invalid. */
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
}

/**
 * Label + control + description + error, wired for accessibility (the label,
 * description and error are linked to the control by Base UI's Field). Put any
 * `Input`, `Select`, `Combobox`… inside as `children`.
 */
function Field({
  className,
  label,
  description,
  error,
  required,
  invalid,
  children,
  ...props
}: FieldProps) {
  const hasError = error !== undefined && error !== null && error !== false && error !== '';
  return (
    <FieldPrimitive.Root
      data-slot="field"
      invalid={invalid ?? hasError}
      className={cn('flex flex-col gap-field', className)}
      {...props}
    >
      {label ? (
        <FieldPrimitive.Label className="text-label text-text-primary flex items-center gap-1">
          {label}
          {required ? <RequiredMark /> : null}
        </FieldPrimitive.Label>
      ) : null}
      {children}
      {description ? (
        <FieldPrimitive.Description className="text-b3 text-text-secondary">
          {description}
        </FieldPrimitive.Description>
      ) : null}
      {hasError ? (
        <FieldPrimitive.Error match className="text-b3 text-danger" role="alert">
          {error}
        </FieldPrimitive.Error>
      ) : null}
    </FieldPrimitive.Root>
  );
}

export { Field };
export type { FieldProps };

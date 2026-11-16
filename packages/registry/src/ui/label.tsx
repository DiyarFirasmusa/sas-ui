import { cn } from '@/lib/utils';

interface LabelProps extends React.ComponentProps<'label'> {
  /** Adds a visual required marker; screen readers get it from the control's `required`. */
  required?: boolean;
}

/** The dashboards' field label: `text-label` (600 12/18) in the primary text colour. */
function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      data-slot="label"
      className={cn(
        'flex items-center gap-1 text-label text-text-primary select-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {children}
      {required ? <RequiredMark /> : null}
    </label>
  );
}

/** Required marker after a label: danger colour, hidden from assistive tech (the control carries `required`). */
function RequiredMark({ className }: { className?: string }) {
  return (
    <span data-slot="required-mark" aria-hidden="true" className={cn('text-danger', className)}>
      *
    </span>
  );
}

export { Label, RequiredMark };

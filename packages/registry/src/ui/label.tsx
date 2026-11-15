import { cn } from '@/lib/utils';

interface LabelProps extends React.ComponentProps<'label'> {
  /** Adds a visual required marker; screen readers get it from the control's `required`. */
  required?: boolean;
}

function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      data-slot="label"
      className={cn(
        'flex items-center gap-1 text-label text-text-secondary select-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span aria-hidden="true" className="text-danger">
          *
        </span>
      ) : null}
    </label>
  );
}

export { Label };

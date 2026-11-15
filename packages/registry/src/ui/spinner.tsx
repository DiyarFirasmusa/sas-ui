import { LoaderIcon } from '@/components/ui/icons';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'loading'> = {
  en: { loading: 'Loading' },
  ar: { loading: 'جارٍ التحميل' },
};

interface SpinnerProps extends React.ComponentProps<'span'> {
  /** Accessible name; defaults to "Loading" in the active locale. */
  label?: string;
}

/** Indeterminate activity indicator. Spins unless the user prefers reduced motion. */
function Spinner({ className, label, ...props }: SpinnerProps) {
  const labels = useLabels(messages, label ? { loading: label } : undefined);
  return (
    <span
      role="status"
      aria-label={labels.loading}
      data-slot="spinner"
      className={cn('inline-flex', className)}
      {...props}
    >
      <LoaderIcon className="size-4 animate-spin motion-reduce:animate-none" />
    </span>
  );
}

export { Spinner };

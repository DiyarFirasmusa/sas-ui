import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { CheckIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

/*
 * The dashboards' checkbox: 16px, 4px radius, a border that mixes the ink 50%
 * into the page so it reaches 3:1 (WCAG 1.4.11) in both themes, a 3px focus
 * glow and a hit area that reaches 12px/8px beyond the box (`after:`).
 */
/** Checkbox with an indeterminate state. Pair with `Field` or a `<label>` for a name. */
function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer relative inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-[color-mix(in_oklab,var(--text-primary)_50%,transparent)] bg-surface shadow-small outline-none',
        'transition-[border-color,box-shadow,background-color] duration-150 motion-reduce:transition-none',
        'after:absolute after:-inset-x-3 after:-inset-y-2',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        'data-[checked]:border-primary data-[checked]:bg-primary data-[checked]:text-primary-foreground',
        'data-[indeterminate]:border-primary data-[indeterminate]:bg-primary data-[indeterminate]:text-primary-foreground',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        'data-[invalid]:border-danger data-[invalid]:ring-3 data-[invalid]:ring-danger/20 data-[invalid]:data-[checked]:border-primary data-[invalid]:data-[indeterminate]:border-primary',
        'aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger/20 aria-invalid:aria-checked:border-primary',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>
            {state.indeterminate ? (
              <span className="h-0.5 w-2.5 rounded-full bg-current" />
            ) : (
              <CheckIcon />
            )}
          </span>
        )}
      />
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };

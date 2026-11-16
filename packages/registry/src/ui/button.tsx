import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { LoaderIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { variants, type VariantProps } from '@/lib/variants';

const buttonVariants = variants(
  [
    'group/button inline-flex shrink-0 items-center justify-center gap-field',
    'rounded-control text-button-1 whitespace-nowrap select-none',
    'transition-colors outline-none',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    'aria-disabled:pointer-events-none aria-disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary: 'bg-primary-light text-primary-text hover:bg-primary-light/70',
        outline: 'border border-stroke-strong bg-surface text-text-primary hover:bg-hover-row',
        'outline-primary':
          'border border-primary-text bg-transparent text-primary-text hover:bg-primary-tint',
        ghost: 'text-text-primary hover:bg-hover-row',
        destructive: 'bg-danger text-danger-foreground hover:bg-danger/90',
        'destructive-soft': 'bg-tag-red-container text-tag-red hover:bg-tag-red-container/70',
        link: 'text-primary-text underline-offset-4 hover:underline',
      },
      size: {
        xs: 'h-7 px-2 text-button-2',
        sm: 'h-8 px-3 text-button-2',
        default: 'h-9.5 px-row',
        lg: 'h-11 px-card',
        icon: 'size-9.5',
        'icon-xs': 'size-7',
        'icon-sm': 'size-8',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** Shows a spinner, marks the button busy and blocks clicks (single-flight). */
    loading?: boolean;
  };

/**
 * The one button. For navigation render a real link and borrow the styling:
 * `<a href="/x" className={buttonVariants({ variant: 'outline' })}>`.
 * While `loading`, the button stays in the tab order (so focus is not lost)
 * but ignores activation.
 */
function Button({
  className,
  variant,
  size,
  loading = false,
  disabled,
  children,
  onClick,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-loading={loading ? '' : undefined}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      disabled={disabled}
      focusableWhenDisabled={loading}
      className={cn(buttonVariants({ variant, size }), className)}
      // preventDefault stops a submit button from submitting its form a second time.
      onClick={loading ? (event) => event.preventDefault() : onClick}
      {...props}
    >
      {loading ? <LoaderIcon className="animate-spin motion-reduce:animate-none" /> : null}
      {children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
export type { ButtonProps };

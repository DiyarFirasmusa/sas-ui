import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { LoaderIcon } from '@/components/ui/icons';
import { Slot } from '@/lib/slot';
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
        // Dark brand-secondary solid (the sidebar/auth-panel tone); hover blends toward the foreground.
        navy: 'bg-primary-container text-primary-foreground hover:bg-primary-container/90',
        link: 'text-primary-text underline-offset-4 hover:underline',
      },
      size: {
        xs: 'h-7 px-2 text-button-2',
        sm: 'h-8 px-3 text-button-2',
        default: 'h-9.5 px-row',
        lg: 'h-11 px-card',
        // Fully rounded 40px, for a prominent call to action in a top bar.
        pill: 'h-10 rounded-pill px-card',
        icon: 'size-9.5',
        'icon-xs': 'size-7',
        'icon-sm': 'size-8',
        'icon-lg': 'size-11',
      },
    },
    // A link has no box at any size: `h-auto p-0` wins over every size's height and padding.
    compoundVariants: [{ variant: 'link', class: 'h-auto p-0' }],
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /**
     * Renders the single child element (a router link, an anchor) with the
     * button's look instead of a `<button>`. `loading` has no effect then:
     * a link cannot be made inert without changing its semantics.
     */
    asChild?: boolean;
    /** Shows a spinner, marks the button busy and blocks clicks (single-flight). */
    loading?: boolean;
  };

/**
 * The one button. `asChild` lends the look to a link; otherwise navigation can
 * borrow the styling: `<a href="/x" className={buttonVariants({ variant: 'outline' })}>`.
 * While `loading`, the button stays in the tab order (so focus is not lost)
 * but ignores activation. `data-variant` / `data-size` expose the choice for
 * tests and CSS hooks.
 */
function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  onClick,
  render,
  nativeButton,
  focusableWhenDisabled,
  style,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  const hooks = {
    'data-slot': 'button',
    'data-variant': variant ?? 'default',
    'data-size': size ?? 'default',
  };

  if (asChild) {
    return (
      <Slot
        {...hooks}
        {...props}
        onClick={onClick}
        style={typeof style === 'function' ? undefined : style}
        className={classes}
      >
        {children}
      </Slot>
    );
  }

  return (
    <ButtonPrimitive
      {...hooks}
      data-loading={loading ? '' : undefined}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      disabled={disabled}
      focusableWhenDisabled={loading || focusableWhenDisabled}
      render={render}
      nativeButton={nativeButton}
      style={style}
      className={classes}
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

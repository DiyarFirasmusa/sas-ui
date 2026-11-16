import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { LoaderIcon } from '@/components/ui/icons';
import { Slot } from '@/lib/slot';
import { cn } from '@/lib/utils';
import { variants, type VariantProps } from '@/lib/variants';

/*
 * The owner's button (compact system of the inventory/tourism dashboards; the
 * `hr` preset makes the same component comfortable through the geometry
 * tokens): height `h-control` (38px · lg 44 · sm 32 · xs 28), `px-control-x`
 * (16px), `rounded-control` (10px), `text-control` (600 13/19.5), a 1px
 * transparent border so outlined variants do not shift the layout, a 150ms
 * colour/shadow transition, a 2px primary-highlight focus outline and the
 * disabled-container fill for disabled buttons. A bare icon child is 18px
 * (16px at sm, 14px at xs); icons that carry their own `size-*` keep it.
 */
const buttonVariants = variants(
  [
    'group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-field',
    'rounded-control border border-transparent text-control whitespace-nowrap select-none',
    'transition-[background-color,border-color,color,box-shadow] duration-150 ease-[ease] motion-reduce:transition-none',
    'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-highlight',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-disabled-container disabled:text-text-inactive disabled:shadow-none',
    'aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:border-transparent aria-disabled:bg-disabled-container aria-disabled:text-text-inactive aria-disabled:shadow-none',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5",
  ],
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-primary hover:bg-primary-hover',
        // Dark brand-secondary solid (the sidebar/auth-panel tone); hover blends toward the foreground.
        navy: 'bg-primary-container text-primary-foreground hover:bg-[color-mix(in_oklab,var(--primary-container)_88%,var(--primary-foreground))]',
        // A 6% ink wash with the 1px stroke, the app's "secondary" button.
        outline: 'border-stroke bg-text-primary/6 text-text-primary hover:bg-hover-row',
        'outline-primary':
          'border-primary-highlight bg-transparent text-primary-text hover:bg-primary-light',
        secondary:
          'bg-primary-light text-primary-text hover:bg-[color-mix(in_oklab,var(--primary-light)_85%,var(--primary-highlight))]',
        ghost: 'bg-transparent text-text-primary hover:bg-hover-row',
        // Solid red for confirm actions (the app's `destructiveSolid`).
        destructive:
          'bg-danger text-danger-foreground hover:bg-[color-mix(in_oklab,var(--danger)_88%,var(--text-primary))]',
        // The 8-9% red tint with red text (the app's `destructive`); the hover keeps the hue so --tag-red text stays at 4.5:1.
        'destructive-soft': 'bg-tag-red-container text-tag-red hover:bg-tag-red/12',
        link: 'bg-transparent text-primary-text underline-offset-4 hover:underline',
      },
      size: {
        xs: "h-control-xs px-inline text-label [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-control-sm px-row text-button-2 [&_svg:not([class*='size-'])]:size-4",
        default: 'h-control px-control-x',
        // 20px wide in the compact system, 24px in the comfortable one.
        lg: 'h-control-lg px-[calc(var(--control-px,16px)+4px)]',
        // Fully rounded 40px, for a prominent call to action in a top bar.
        pill: 'h-10 rounded-pill px-5',
        // 40px square in the compact system, 44px in the comfortable one:
        // `min` picks control+2px against the input height. The preset's own
        // `--control-*` variables are read (not the `--spacing-control*` theme
        // ones, which resolve once at :root and so ignore a scoped preset).
        icon: 'size-[min(calc(var(--control-h,38px)+2px),var(--control-h-input,42px))] px-0',
        'icon-xs': "size-control-xs px-0 text-label [&_svg:not([class*='size-'])]:size-3.5",
        'icon-sm': "size-control-sm px-0 [&_svg:not([class*='size-'])]:size-4",
        'icon-lg': 'size-control-lg px-0',
      },
    },
    // A link has no box at any size: `h-auto p-0` wins over every size's height and padding,
    // and a disabled one keeps its transparent fill instead of the grey chip.
    compoundVariants: [
      {
        variant: 'link',
        class: 'h-auto p-0 disabled:bg-transparent aria-disabled:bg-transparent',
      },
    ],
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

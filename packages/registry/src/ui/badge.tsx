import { cn } from '@/lib/utils';
import { variants, type VariantProps } from '@/lib/variants';

/**
 * `tone` picks one of the preset's tag hues: text and container come from the
 * same pair, which the contrast tests keep at WCAG AA in every preset. The
 * shape is the dashboards' badge: a 26px pill (22px for `size="sm"`), 12px
 * semibold text, a tinted container.
 */
const badgeVariants = variants(
  'inline-flex w-fit shrink-0 items-center justify-center whitespace-nowrap rounded-pill',
  {
    variants: {
      tone: {
        neutral: 'bg-tag-neutral-container text-text-secondary',
        green: 'bg-tag-green-container text-tag-green',
        red: 'bg-tag-red-container text-tag-red',
        yellow: 'bg-tag-yellow-container text-tag-yellow',
        orange: 'bg-tag-orange-container text-tag-orange',
        cyan: 'bg-tag-cyan-container text-tag-cyan',
        purple: 'bg-tag-purple-container text-tag-purple',
        blue: 'bg-tag-blue-container text-tag-blue',
        primary: 'bg-primary-light text-primary-text',
        solid: 'bg-primary text-primary-foreground',
      },
      size: {
        default: 'h-[26px] gap-field px-inline text-[12px]/none font-semibold [&>svg]:size-3.5',
        sm: 'h-[22px] gap-1 px-field text-[11px]/none font-semibold [&>svg]:size-3',
      },
      outline: {
        true: 'border border-current bg-transparent',
        false: '',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'default', outline: false },
  },
);

interface BadgeOwnProps {
  /**
   * Status style: a 5px dot and the tone's text with no container, as table
   * status cells draw it. Without it the badge is a tinted chip.
   */
  dot?: boolean;
}

type BadgeProps = React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & BadgeOwnProps;

function Badge({ className, tone, size, outline, dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-dot={dot ? '' : undefined}
      className={cn(
        badgeVariants({ tone, size, outline }),
        dot && 'bg-transparent px-0',
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden="true"
          data-slot="badge-dot"
          className="rounded-pill size-[5px] shrink-0 bg-current"
        />
      ) : null}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };

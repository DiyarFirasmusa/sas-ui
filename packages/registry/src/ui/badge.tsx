import { cn } from '@/lib/utils';
import { variants, type VariantProps } from '@/lib/variants';

/**
 * `tone` picks one of the preset's tag hues: text and container come from the
 * same pair, which the contrast tests keep at WCAG AA in every preset.
 */
const badgeVariants = variants(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-pill px-inline py-0.5 text-label whitespace-nowrap [&>svg]:size-3.5',
  {
    variants: {
      tone: {
        neutral: 'bg-tag-neutral-container text-tag-neutral',
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
      outline: {
        true: 'border border-current bg-transparent',
        false: '',
      },
    },
    defaultVariants: { tone: 'neutral', outline: false },
  },
);

type BadgeProps = React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

function Badge({ className, tone, outline, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ tone, outline }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };

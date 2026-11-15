import { Separator as SeparatorPrimitive } from '@base-ui/react/separator';
import { cn } from '@/lib/utils';

interface SeparatorProps extends SeparatorPrimitive.Props {
  /**
   * Purely visual divider: removed from the accessibility tree. Leave it off
   * when the line separates distinct regions a screen-reader user should hear.
   */
  decorative?: boolean;
}

function Separator({
  className,
  orientation = 'horizontal',
  decorative = false,
  ...props
}: SeparatorProps) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      {...(decorative ? { role: 'none', 'aria-orientation': undefined } : {})}
      className={cn(
        'shrink-0 bg-stroke',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full min-h-4 w-px self-stretch',
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
export type { SeparatorProps };

import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import { useLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';

interface TooltipProviderProps {
  children?: React.ReactNode;
  /** Hover delay before a tooltip opens, in ms. Default 400. */
  delay?: number;
  /** Delay before it closes after the pointer leaves, in ms. */
  closeDelay?: number;
  /** After one tooltip closes, others open instantly for this long (ms). */
  timeout?: number;
}

/**
 * Wrap an app region once so neighbouring tooltips share their delay: after
 * the first one opens, moving to the next shows it without waiting again.
 */
function TooltipProvider({ delay = 400, ...props }: TooltipProviderProps) {
  return <TooltipPrimitive.Provider delay={delay} {...props} />;
}

function Tooltip(props: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

/**
 * Opens on hover and keyboard focus. A tooltip is a supplement, never the
 * only carrier of a name: an icon-only trigger still needs its own
 * `aria-label`, because touch users and some screen readers never see the
 * tooltip.
 */
function TooltipTrigger(props: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

interface TooltipContentProps extends TooltipPrimitive.Popup.Props {
  side?: TooltipPrimitive.Positioner.Props['side'];
  align?: TooltipPrimitive.Positioner.Props['align'];
  sideOffset?: number;
  /** Show a small arrow pointing at the trigger. */
  showArrow?: boolean;
}

function TooltipContent({
  className,
  children,
  side = 'top',
  align = 'center',
  sideOffset = 6,
  showArrow = false,
  ...props
}: TooltipContentProps) {
  // Base UI resolves `inline-start`/`inline-end` against its own direction
  // context, which does not read <html dir>, so feed it the locale's.
  const { direction } = useLocale();
  return (
    <TooltipPrimitive.Portal>
      <DirectionProvider direction={direction}>
        <TooltipPrimitive.Positioner
          side={side}
          align={align}
          sideOffset={sideOffset}
          className="z-50 outline-none"
        >
          <TooltipPrimitive.Popup
            data-slot="tooltip-content"
            className={cn(
              'max-w-xs origin-(--transform-origin) rounded-md bg-text-primary px-field py-1 text-b3 text-background shadow-mid',
              'transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
              'data-[instant]:duration-0 motion-reduce:transition-none',
              className,
            )}
            {...props}
          >
            {children}
            {showArrow ? (
              <TooltipPrimitive.Arrow
                data-slot="tooltip-arrow"
                className={cn(
                  'size-2 rotate-45 bg-text-primary',
                  'data-[side=top]:-bottom-1 data-[side=bottom]:-top-1',
                  'data-[side=inline-start]:-end-1 data-[side=inline-end]:-start-1',
                )}
              />
            ) : null}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </DirectionProvider>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
export type { TooltipContentProps, TooltipProviderProps };

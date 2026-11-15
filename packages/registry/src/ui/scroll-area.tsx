import { DirectionProvider } from '@base-ui/react/direction-provider';
import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';
import { useLocale, type Direction } from '@/lib/locale';
import { cn } from '@/lib/utils';

interface ScrollAreaProps extends ScrollAreaPrimitive.Root.Props {
  /** Which scrollbars to offer. Default `vertical`. */
  orientation?: 'vertical' | 'horizontal' | 'both';
  /** Text direction of the scrolled content; defaults to the active locale's. */
  dir?: Direction;
  /** Props for the scrolling element, e.g. `aria-label` to name the region. */
  viewportProps?: ScrollAreaPrimitive.Viewport.Props;
}

/**
 * Scroll container with thin themed scrollbars. The viewport is focusable so
 * keyboard users can scroll it with the arrow keys; name it with
 * `viewportProps={{ 'aria-label': … }}` when it holds more than prose. The
 * scrollbars sit on the inline-end edge and the thumb math follows `dir`.
 */
function ScrollArea({
  className,
  children,
  orientation = 'vertical',
  dir,
  viewportProps,
  ...props
}: ScrollAreaProps) {
  const locale = useLocale();
  const direction = dir ?? locale.direction;
  return (
    <DirectionProvider direction={direction}>
      <ScrollAreaPrimitive.Root
        data-slot="scroll-area"
        dir={direction}
        className={cn('relative overflow-hidden', className)}
        {...props}
      >
        <ScrollAreaPrimitive.Viewport
          data-slot="scroll-area-viewport"
          {...viewportProps}
          className={cn(
            'size-full rounded-[inherit] outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
            viewportProps?.className,
          )}
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
        {orientation !== 'horizontal' ? <ScrollBar orientation="vertical" /> : null}
        {orientation !== 'vertical' ? <ScrollBar orientation="horizontal" /> : null}
        {orientation === 'both' ? <ScrollAreaPrimitive.Corner /> : null}
      </ScrollAreaPrimitive.Root>
    </DirectionProvider>
  );
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        'flex touch-none p-0.5 opacity-0 transition-opacity select-none',
        'data-[hovering]:opacity-100 data-[scrolling]:opacity-100',
        'motion-reduce:transition-none',
        orientation === 'vertical' ? 'w-2.5' : 'h-2.5 flex-col',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-pill bg-stroke-strong"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
export type { ScrollAreaProps };

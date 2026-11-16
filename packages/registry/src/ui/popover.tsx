import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { cn } from '@/lib/utils';

/**
 * The popup's enter/exit motion: a short fade and scale driven by Base UI's
 * `data-starting-style` / `data-ending-style`. Exported so a popup built on
 * `PopoverPrimitive` elsewhere (a combobox list, a picker) moves the same way.
 */
const popoverMotion = [
  'transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
  'motion-reduce:transition-none',
].join(' ');

function Popover(props: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger(props: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverClose(props: PopoverPrimitive.Close.Props) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
}

type PositionerProps = Pick<
  PopoverPrimitive.Positioner.Props,
  | 'align'
  | 'alignOffset'
  | 'side'
  | 'sideOffset'
  | 'anchor'
  | 'positionMethod'
  | 'collisionPadding'
  | 'collisionAvoidance'
  | 'sticky'
>;

interface PopoverContentProps extends PopoverPrimitive.Popup.Props, PositionerProps {
  /** Classes for the positioner element that wraps the popup (e.g. a width tied to the anchor). */
  positionerClassName?: string;
}

/**
 * Floating panel anchored to its trigger; focus moves inside and returns on
 * close. The positioning props pass straight to Base UI: `anchor` positions
 * against another element than the trigger (an input, a virtual rect),
 * `positionMethod="fixed"` escapes clipping containers, `collisionPadding` /
 * `collisionAvoidance` / `sticky` tune how it stays in the viewport.
 */
function PopoverContent({
  className,
  positionerClassName,
  align = 'center',
  alignOffset,
  side = 'bottom',
  sideOffset = 6,
  anchor,
  positionMethod,
  collisionPadding,
  collisionAvoidance,
  sticky,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        anchor={anchor}
        positionMethod={positionMethod}
        collisionPadding={collisionPadding}
        collisionAvoidance={collisionAvoidance}
        sticky={sticky}
        className={cn('z-50 outline-none', positionerClassName)}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            'w-72 max-w-[calc(100vw-2rem)] origin-(--transform-origin) rounded-lg border border-stroke bg-popover p-row text-popover-foreground shadow-large outline-none',
            popoverMotion,
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn('text-h5 text-text-primary', className)}
      {...props}
    />
  );
}

function PopoverDescription({ className, ...props }: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn('text-b2 text-text-secondary', className)}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
  popoverMotion,
};
export type { PopoverContentProps };

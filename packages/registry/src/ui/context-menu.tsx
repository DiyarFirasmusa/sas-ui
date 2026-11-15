import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';

function ContextMenu(props: ContextMenuPrimitive.Root.Props) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}

/**
 * The area that opens the menu on right-click or long-press. Pointer-only by
 * itself: keep every action reachable by keyboard elsewhere (a visible
 * button, a toolbar), because Shift+F10 / the context-menu key only works
 * when the platform sends it to this element.
 */
function ContextMenuTrigger({ className, ...props }: ContextMenuPrimitive.Trigger.Props) {
  return (
    <ContextMenuPrimitive.Trigger
      data-slot="context-menu-trigger"
      className={cn('select-none', className)}
      {...props}
    />
  );
}

function ContextMenuContent({ className, ...props }: ContextMenuPrimitive.Popup.Props) {
  // Base UI resolves submenu direction and arrow keys from its own context,
  // which does not read <html dir>, so feed it the locale's.
  const { direction } = useLocale();
  return (
    <ContextMenuPrimitive.Portal>
      <DirectionProvider direction={direction}>
        <ContextMenuPrimitive.Positioner className="z-50 outline-none">
          <ContextMenuPrimitive.Popup
            data-slot="context-menu-content"
            className={cn(
              'min-w-44 origin-(--transform-origin) overflow-y-auto rounded-lg border border-stroke bg-popover p-1 text-popover-foreground shadow-large outline-none',
              'max-h-(--available-height)',
              'transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
              'motion-reduce:transition-none',
              className,
            )}
            {...props}
          />
        </ContextMenuPrimitive.Positioner>
      </DirectionProvider>
    </ContextMenuPrimitive.Portal>
  );
}

// The items are the same Base UI menu parts the dropdown uses, so they are
// reused as they are and the two menus cannot drift apart visually.
const ContextMenuItem = DropdownMenuItem;
const ContextMenuCheckboxItem = DropdownMenuCheckboxItem;
const ContextMenuRadioGroup = DropdownMenuRadioGroup;
const ContextMenuRadioItem = DropdownMenuRadioItem;
const ContextMenuGroup = DropdownMenuGroup;
const ContextMenuLabel = DropdownMenuLabel;
const ContextMenuSeparator = DropdownMenuSeparator;
const ContextMenuSub = DropdownMenuSub;
const ContextMenuSubTrigger = DropdownMenuSubTrigger;

/**
 * Submenu panel. It anchors to its sub-trigger, not to the cursor, so it
 * uses the plain menu positioner and opens on the inline-end side.
 */
function ContextMenuSubContent({ className, ...props }: MenuPrimitive.Popup.Props) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        side="inline-end"
        align="start"
        sideOffset={2}
        className="z-50 outline-none"
      >
        <MenuPrimitive.Popup
          data-slot="context-menu-sub-content"
          className={cn(
            'min-w-44 origin-(--transform-origin) overflow-y-auto rounded-lg border border-stroke bg-popover p-1 text-popover-foreground shadow-large outline-none',
            'max-h-(--available-height)',
            'transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            'motion-reduce:transition-none',
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
};

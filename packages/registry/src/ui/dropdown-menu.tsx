import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { CheckIcon, ChevronRightIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

function DropdownMenu(props: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger(props: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

interface DropdownMenuContentProps extends MenuPrimitive.Popup.Props {
  align?: MenuPrimitive.Positioner.Props['align'];
  side?: MenuPrimitive.Positioner.Props['side'];
  sideOffset?: number;
}

function DropdownMenuContent({
  className,
  align = 'start',
  side = 'bottom',
  sideOffset = 4,
  ...props
}: DropdownMenuContentProps) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
        className="z-50 outline-none"
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
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

const itemClasses = [
  'relative flex min-h-9 cursor-default items-center gap-field rounded-md px-inline text-b1 outline-none select-none',
  'data-[highlighted]:bg-hover-row data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  "[&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
].join(' ');

interface DropdownMenuItemProps extends MenuPrimitive.Item.Props {
  /** Styles the item as a destructive action (delete, revoke…). */
  destructive?: boolean;
}

function DropdownMenuItem({ className, destructive, ...props }: DropdownMenuItemProps) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        itemClasses,
        destructive && 'text-danger data-[highlighted]:bg-tag-red-container',
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: MenuPrimitive.CheckboxItem.Props) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(itemClasses, 'ps-8', className)}
      {...props}
    >
      <MenuPrimitive.CheckboxItemIndicator className="absolute start-2 flex items-center">
        <CheckIcon className="text-primary-text size-4" />
      </MenuPrimitive.CheckboxItemIndicator>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup(props: MenuPrimitive.RadioGroup.Props) {
  return <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuRadioItem({ className, children, ...props }: MenuPrimitive.RadioItem.Props) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(itemClasses, 'ps-8', className)}
      {...props}
    >
      <MenuPrimitive.RadioItemIndicator className="absolute start-2 flex items-center">
        <CheckIcon className="text-primary-text size-4" />
      </MenuPrimitive.RadioItemIndicator>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

function DropdownMenuGroup(props: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuLabel({ className, ...props }: MenuPrimitive.GroupLabel.Props) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      className={cn('px-inline py-1.5 text-label text-text-muted', className)}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('-mx-1 my-1 h-px bg-stroke', className)}
      {...props}
    />
  );
}

function DropdownMenuSub(props: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      className={cn(itemClasses, 'justify-between data-[popup-open]:bg-hover-row', className)}
      {...props}
    >
      {children}
      <ChevronRightIcon className="text-text-muted size-4" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};

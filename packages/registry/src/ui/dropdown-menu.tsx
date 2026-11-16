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
  alignOffset?: number;
  side?: MenuPrimitive.Positioner.Props['side'];
  sideOffset?: number;
}

function DropdownMenuContent({
  className,
  align = 'start',
  alignOffset,
  side = 'bottom',
  sideOffset = 4,
  ...props
}: DropdownMenuContentProps) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
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

/** Indents an item by the width of the check column, to align it with items that have a leading icon or check. */
const insetClasses = 'data-[inset]:ps-8';

interface DropdownMenuItemProps extends MenuPrimitive.Item.Props {
  /** Styles the item as a destructive action (delete, revoke…). */
  destructive?: boolean;
  /** `variant="destructive"` is the same as `destructive`, for call sites that spell it as a variant. */
  variant?: 'default' | 'destructive';
  /** Indent to line up with items that carry a check or an icon. */
  inset?: boolean;
}

function DropdownMenuItem({
  className,
  destructive,
  variant = 'default',
  inset,
  ...props
}: DropdownMenuItemProps) {
  const isDestructive = destructive === true || variant === 'destructive';
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-variant={isDestructive ? 'destructive' : 'default'}
      data-inset={inset ? '' : undefined}
      className={cn(
        itemClasses,
        insetClasses,
        isDestructive && 'text-danger data-[highlighted]:bg-tag-red-container',
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

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: MenuPrimitive.GroupLabel.Props & {
  /** Indent to line up with inset items. */
  inset?: boolean;
}) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      data-inset={inset ? '' : undefined}
      className={cn('px-inline py-1.5 text-label text-text-muted', insetClasses, className)}
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
  inset,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  /** Indent to line up with inset items. */
  inset?: boolean;
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset ? '' : undefined}
      className={cn(
        itemClasses,
        insetClasses,
        'justify-between data-[popup-open]:bg-hover-row',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="text-text-muted size-4" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

/**
 * The popup a `DropdownMenuSubTrigger` opens. It opens toward the end edge
 * (the left in Arabic) and opens with the arrow key that points that way.
 */
function DropdownMenuSubContent({
  className,
  side = 'inline-end',
  align = 'start',
  alignOffset = -4,
  sideOffset = 2,
  ...props
}: DropdownMenuContentProps) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      side={side}
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={cn('min-w-36', className)}
      {...props}
    />
  );
}

/** Keyboard hint pushed to the end of an item, e.g. `⌘K`. Latin text stays left-to-right. */
function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      dir="ltr"
      className={cn('ms-auto ps-field text-b3 text-text-muted', className)}
      {...props}
    />
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
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
export type { DropdownMenuContentProps, DropdownMenuItemProps };

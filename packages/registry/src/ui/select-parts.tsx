import { Select as SelectPrimitive } from '@base-ui/react/select';
import type { ReactNode } from 'react';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@/components/ui/icons';
import { controlClasses, controlSizeClasses, optionClasses } from '@/components/ui/input';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

/*
 * The composable Select: the same Base UI engine as the options-array `Select`
 * in select.tsx, but every part is yours to arrange. Reach for it when the
 * trigger shows something other than the option label (a code, an icon, a
 * count), when options are grouped, or when items are built from your own data.
 */

const messages: Messages<'empty'> = {
  en: { empty: 'No options' },
  ar: { empty: 'لا توجد خيارات' },
};

const popupClasses = [
  'isolate flex max-h-[min(18rem,var(--available-height,18rem))] w-(--anchor-width,max-content) min-w-(--anchor-width,8rem)',
  'origin-(--transform-origin) flex-col overflow-hidden rounded-lg border border-stroke bg-popover text-popover-foreground shadow-large outline-none',
  'transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
  'motion-reduce:transition-none data-[align-trigger=true]:transition-none',
].join(' ');

/**
 * Root: owns the value, the open state and the hidden form input. Pass
 * `items` (`{ value, label }[]`) so the trigger can show a label before the
 * list has ever been opened; without it the raw value shows until then.
 */
function SelectRoot<Value = string, Multiple extends boolean | undefined = false>(
  props: SelectPrimitive.Root.Props<Value, Multiple>,
) {
  return <SelectPrimitive.Root {...props} />;
}

interface SelectTriggerProps extends SelectPrimitive.Trigger.Props {
  /** `sm` is a 40px trigger (compact system) for toolbars and table cells; the default matches `Input`. */
  size?: 'default' | 'sm';
}

/** The control that opens the list. The chevron sits at the end edge in both directions. */
function SelectTrigger({ className, size = 'default', children, ...props }: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        controlClasses,
        'cursor-pointer justify-between whitespace-nowrap data-[popup-open]:border-primary-highlight',
        size === 'sm' && controlSizeClasses.sm,
        '[&_svg]:pointer-events-none [&_svg]:shrink-0',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="text-text-secondary">
        <ChevronDownIcon className="size-5" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

interface SelectValueProps extends Omit<SelectPrimitive.Value.Props, 'children'> {
  /**
   * Static content, or a function that renders the selected value, for
   * example `(value) => value.toUpperCase()`. It receives `null` while
   * nothing is selected, so handle that case or give a `placeholder`.
   */
  children?: ReactNode | ((value: string | null) => ReactNode);
}

/** What the trigger shows. Falls back to the selected item's label or the placeholder. */
function SelectValue({ className, children, ...props }: SelectValueProps) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn(
        'min-w-0 flex-1 truncate text-start data-[placeholder]:text-text-muted',
        className,
      )}
      {...props}
    >
      {children}
    </SelectPrimitive.Value>
  );
}

interface SelectContentProps extends SelectPrimitive.Popup.Props {
  side?: SelectPrimitive.Positioner.Props['side'];
  sideOffset?: number;
  align?: SelectPrimitive.Positioner.Props['align'];
  alignOffset?: number;
  /** Overlay the popup on the trigger so the selected item lines up (the dashboards' look). On by default. */
  alignItemWithTrigger?: boolean;
}

/** The popup: a scrollable listbox with scroll arrows, positioned under the trigger. */
function SelectContent({
  className,
  children,
  side = 'bottom',
  sideOffset = 4,
  align = 'start',
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="z-50 outline-none"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(popupClasses, className)}
          {...props}
        >
          <SelectPrimitive.ScrollUpArrow
            data-slot="select-scroll-up"
            className="bg-popover text-text-secondary z-10 flex w-full cursor-default items-center justify-center py-1"
          >
            <ChevronUpIcon className="size-4" />
          </SelectPrimitive.ScrollUpArrow>
          <SelectPrimitive.List className="flex-1 overflow-x-hidden overflow-y-auto p-1">
            {children}
          </SelectPrimitive.List>
          <SelectPrimitive.ScrollDownArrow
            data-slot="select-scroll-down"
            className="bg-popover text-text-secondary z-10 flex w-full cursor-default items-center justify-center py-1"
          >
            <ChevronDownIcon className="size-4" />
          </SelectPrimitive.ScrollDownArrow>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

interface SelectItemProps extends SelectPrimitive.Item.Props {
  /**
   * Native tooltip for labels that truncate. Defaults to the label when it is
   * plain text; pass a string to show something else.
   */
  title?: string;
}

/** One option. The check mark sits at the end edge and the selected row is tinted. */
function SelectItem({ className, children, title, ...props }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      title={title ?? (typeof children === 'string' ? children : undefined)}
      className={cn(optionClasses, className)}
      {...props}
    >
      <SelectPrimitive.ItemText className="min-w-0 flex-1 truncate">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        data-slot="select-item-indicator"
        className="text-primary-text pointer-events-none absolute end-2 inline-flex size-4 items-center justify-center"
      >
        <CheckIcon className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

/** Groups related items under a `SelectLabel`. */
function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" className={cn(className)} {...props} />;
}

/** Caption of a `SelectGroup`; screen readers announce it as the group name. */
function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn('px-inline py-1.5 text-b3 text-text-secondary', className)}
      {...props}
    />
  );
}

function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('pointer-events-none -mx-1 my-1 h-px bg-stroke', className)}
      {...props}
    />
  );
}

interface SelectEmptyProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Replaces the localised "No options" text. */
  children?: ReactNode;
}

/**
 * Row to render in place of the items when there are none (an empty or fully
 * filtered list). It is exposed as a disabled option so the listbox stays valid, and it cannot be picked.
 */
function SelectEmpty({ className, children, ...props }: SelectEmptyProps) {
  const labels = useLabels(messages);
  return (
    <div
      data-slot="select-empty"
      // A listbox must contain an option; a dimmed one keeps an empty list valid for assistive tech.
      role="option"
      aria-disabled="true"
      aria-selected="false"
      className={cn('px-inline py-6 text-center text-b2 text-text-secondary', className)}
      {...props}
    >
      {children ?? labels.empty}
    </div>
  );
}

export {
  SelectContent,
  SelectEmpty,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
export type {
  SelectContentProps,
  SelectEmptyProps,
  SelectItemProps,
  SelectTriggerProps,
  SelectValueProps,
};

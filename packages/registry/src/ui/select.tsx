import { Select as SelectPrimitive } from '@base-ui/react/select';
import type { ReactNode } from 'react';
import { CheckIcon, ChevronDownIcon } from '@/components/ui/icons';
import { controlClasses } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface SelectProps
  extends Omit<SelectPrimitive.Root.Props<string>, 'items' | 'children' | 'multiple'> {
  options: readonly SelectOption[];
  placeholder?: ReactNode;
  /** Classes for the trigger button. */
  className?: string;
  /** Accessible name when there is no surrounding `Field` label. */
  'aria-label'?: string;
  id?: string;
}

/**
 * Single-choice dropdown driven by an `options` array. The popup is a real
 * listbox with type-ahead and arrow-key navigation; the trigger follows the
 * UI direction, so the chevron sits at the end in both languages.
 */
function Select({
  options,
  placeholder,
  className,
  id,
  'aria-label': ariaLabel,
  ...props
}: SelectProps) {
  const items = options.map((option) => ({ value: option.value, label: option.label }));
  return (
    <SelectPrimitive.Root data-slot="select" items={items} {...props}>
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        data-slot="select-trigger"
        className={cn(controlClasses, 'cursor-pointer justify-between data-[popup-open]:border-primary-highlight', className)}
      >
        <SelectPrimitive.Value
          placeholder={placeholder}
          className="truncate data-[placeholder]:text-text-muted"
        />
        <SelectPrimitive.Icon className="text-text-muted">
          <ChevronDownIcon />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner sideOffset={4} className="z-50 outline-none" alignItemWithTrigger={false}>
          <SelectPrimitive.Popup
            data-slot="select-content"
            className={cn(
              'max-h-72 min-w-(--anchor-width) origin-(--transform-origin) overflow-y-auto',
              'rounded-lg border border-stroke bg-popover p-1 text-popover-foreground shadow-large outline-none',
              'transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
              'motion-reduce:transition-none',
            )}
          >
            <SelectPrimitive.List>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  data-slot="select-item"
                  className={cn(
                    'relative flex min-h-9 cursor-default items-center gap-field rounded-md ps-8 pe-inline text-b1 outline-none select-none',
                    'data-[highlighted]:bg-hover-row data-[disabled]:opacity-50',
                  )}
                >
                  <SelectPrimitive.ItemIndicator className="absolute start-2 flex items-center">
                    <CheckIcon className="size-4 text-primary-text" />
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export { Select };
export type { SelectOption, SelectProps };

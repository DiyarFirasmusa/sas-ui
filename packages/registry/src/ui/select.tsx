import type { Select as SelectPrimitive } from '@base-ui/react/select';
import type { ReactNode } from 'react';
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-parts';

interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface SelectProps extends Omit<
  SelectPrimitive.Root.Props<string>,
  'items' | 'children' | 'multiple'
> {
  options: readonly SelectOption[];
  placeholder?: ReactNode;
  /** Classes for the trigger button. */
  className?: string;
  /** Accessible name when there is no surrounding `Field` label. */
  'aria-label'?: string;
  id?: string;
}

/**
 * Single-choice dropdown driven by an `options` array: the composable parts of
 * `select-parts` arranged the common way, so the trigger, popup and rows look
 * exactly like theirs (the dashboards' select). The popup is a real listbox
 * with type-ahead and arrow-key navigation; the trigger follows the UI
 * direction, so the chevron sits at the end in both languages.
 */
function Select({
  options,
  placeholder,
  className,
  id,
  'aria-label': ariaLabel,
  ...props
}: SelectProps) {
  const items = options.map((option) => ({
    value: option.value,
    label: option.label,
  }));
  return (
    <SelectRoot items={items} {...props}>
      <SelectTrigger id={id} aria-label={ariaLabel} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}

export { Select };
export type { SelectOption, SelectProps };

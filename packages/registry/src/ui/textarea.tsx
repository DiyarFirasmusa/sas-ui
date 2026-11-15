import { useState, type ChangeEvent } from 'react';
import { controlClasses } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type TextareaProps = Omit<React.ComponentProps<'textarea'>, 'dir'>;

/** Multi-line text; direction follows the typed language like `Input`. */
function Textarea({
  className,
  value,
  defaultValue,
  onChange,
  ...props
}: TextareaProps) {
  const [typedValue, setTypedValue] = useState(String(defaultValue ?? ''));
  const current = value === undefined ? typedValue : String(value);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setTypedValue(event.target.value);
    onChange?.(event);
  }

  return (
    <textarea
      data-slot="textarea"
      dir={current === '' ? undefined : 'auto'}
      value={value}
      defaultValue={defaultValue}
      onChange={handleChange}
      className={cn(controlClasses, 'field-sizing-content h-auto min-h-24 py-2', className)}
      {...props}
    />
  );
}

export { Textarea };

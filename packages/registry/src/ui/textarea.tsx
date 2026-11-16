import { Field as FieldPrimitive } from '@base-ui/react/field';
import { useState, type ChangeEvent, type Ref } from 'react';
import { controlClasses, type controlSizeClasses } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type TextareaProps = Omit<React.ComponentProps<'textarea'>, 'dir' | 'onChange'> & {
  /** `lg` pairs with `Input size="lg"` in a form row: a taller minimum. */
  size?: Exclude<keyof typeof controlSizeClasses, 'sm'>;
  /** Follow the typed language once there is a value (default). `false` keeps the UI direction. */
  autoDirection?: boolean;
  /** Method syntax keeps handlers typed for `HTMLTextAreaElement` assignable. */
  onChange?(event: ChangeEvent<HTMLTextAreaElement>): void;
};

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') {
    ref(node);
  } else if (ref) {
    ref.current = node;
  }
}

/**
 * Multi-line text; direction follows the typed language like `Input`. It is
 * registered with the surrounding `Field` (label, description, error) through
 * Base UI's `Field.Control`, rendered as a textarea.
 */
function Textarea({
  className,
  size = 'default',
  autoDirection = true,
  value,
  defaultValue,
  onChange,
  ...props
}: TextareaProps) {
  const [typedValue, setTypedValue] = useState(String(defaultValue ?? ''));
  const current = value === undefined ? typedValue : String(value);

  return (
    <FieldPrimitive.Control
      render={(controlProps) => (
        <textarea
          {...props}
          {...controlProps}
          // Both the Field registration and the caller's ref (react-hook-form focuses
          // an invalid field through it) must receive the element.
          ref={(node) => {
            assignRef(controlProps.ref, node);
            assignRef(props.ref, node);
          }}
          disabled={props.disabled}
          data-slot="textarea"
          data-size={size}
          dir={current === '' || !autoDirection ? undefined : 'auto'}
          value={value}
          defaultValue={defaultValue}
          onChange={(event) => {
            setTypedValue(event.target.value);
            controlProps.onChange?.(event);
            onChange?.(event);
          }}
          className={cn(
            controlClasses,
            // The multi-line control grows with its content instead of holding the input height.
            'field-sizing-content h-auto min-h-24 resize-y items-start py-3',
            size === 'lg' && 'min-h-28',
            className,
          )}
        />
      )}
    />
  );
}

export { Textarea };
export type { TextareaProps };

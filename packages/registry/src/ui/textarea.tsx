import { Field as FieldPrimitive } from '@base-ui/react/field';
import { useState, type ChangeEvent, type Ref } from 'react';
import { controlClasses } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type TextareaProps = Omit<React.ComponentProps<'textarea'>, 'dir' | 'onChange'> & {
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
function Textarea({ className, value, defaultValue, onChange, ...props }: TextareaProps) {
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
          dir={current === '' ? undefined : 'auto'}
          value={value}
          defaultValue={defaultValue}
          onChange={(event) => {
            setTypedValue(event.target.value);
            controlProps.onChange?.(event);
            onChange?.(event);
          }}
          className={cn(controlClasses, 'field-sizing-content h-auto min-h-24 py-2', className)}
        />
      )}
    />
  );
}

export { Textarea };
export type { TextareaProps };

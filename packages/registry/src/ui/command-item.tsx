import { useContext, useId, useLayoutEffect } from 'react';
import { Kbd } from '@/components/ui/kbd';
import { GroupContext, useCommand } from '@/hooks/use-command';
import { cn } from '@/lib/utils';

interface CommandItemProps extends Omit<React.ComponentProps<'div'>, 'onSelect' | 'value'> {
  /** What the search matches against. Defaults to the text when `children` is a string. */
  value?: string;
  /** Extra words that also match, e.g. synonyms. */
  keywords?: string[];
  disabled?: boolean;
  /** Called with the item's value on click or Enter. */
  onSelect?: (value: string) => void;
  /** Key caps shown at the end, e.g. `['Ctrl', 'K']`. */
  shortcut?: string[];
}

function CommandItem({
  value,
  keywords,
  disabled = false,
  onSelect,
  shortcut,
  className,
  children,
  onClick,
  ...props
}: CommandItemProps) {
  const command = useCommand();
  const group = useContext(GroupContext);
  const id = useId();
  const text = value ?? (typeof children === 'string' ? children : '');
  const keywordKey = (keywords ?? []).join('\u0000');
  const { register } = command;

  useLayoutEffect(
    () =>
      register(id, {
        value: text,
        keywords: keywordKey ? keywordKey.split('\u0000') : [],
        group,
      }),
    [register, id, text, keywordKey, group],
  );

  if (!command.isMatch({ value: text, keywords: keywords ?? [], group })) {
    return null;
  }
  const active = command.activeId === id;

  return (
    <div
      data-slot="command-item"
      id={id}
      role="option"
      aria-selected={active}
      aria-disabled={disabled || undefined}
      data-selected={active ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      // Keep focus in the input so typing and arrow keys keep working.
      onMouseDown={(event) => event.preventDefault()}
      onPointerMove={() => {
        if (!disabled && !active) {
          command.setActiveId(id);
        }
      }}
      onClick={(event) => {
        onClick?.(event);
        if (!disabled && !event.defaultPrevented) {
          onSelect?.(text);
        }
      }}
      className={cn(
        'relative flex min-h-11 cursor-default items-center gap-field rounded-md px-inline text-b1 outline-none select-none sm:min-h-9',
        'data-[selected]:bg-hover-row data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        "[&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {children}
      {shortcut ? <CommandShortcut keys={shortcut} /> : null}
    </div>
  );
}

/** Pushes key caps to the inline end of an item. */
function CommandShortcut({ keys, className }: { keys: string[]; className?: string }) {
  return <Kbd keys={keys} className={cn('ms-auto', className)} />;
}

export { CommandItem, CommandShortcut };
export type { CommandItemProps };

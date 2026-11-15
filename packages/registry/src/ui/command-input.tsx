import { SearchIcon } from '@/components/ui/icons';
import { useCommand } from '@/hooks/use-command';
import { commandMessages } from '@/lib/command-messages';
import { useLabels } from '@/lib/locale';
import { cn } from '@/lib/utils';

interface CommandInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'type' | 'role'> {
  /** Accessible name; defaults to "Search" / "بحث". */
  label?: string;
}

function CommandInput({
  className,
  label,
  placeholder,
  onKeyDown,
  onChange,
  ...props
}: CommandInputProps) {
  const command = useCommand();
  const labels = useLabels(commandMessages);

  function move(step: 1 | -1) {
    const available = command.options();
    if (available.length === 0) {
      return;
    }
    const current = available.findIndex((option) => option.id === command.activeId);
    const next =
      current === -1
        ? step === 1
          ? 0
          : available.length - 1
        : (current + step + available.length) % available.length;
    command.setActiveId(available[next]?.id ?? null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing) {
      return;
    }
    const available = command.options();
    switch (event.key) {
      case 'ArrowDown':
        move(1);
        break;
      case 'ArrowUp':
        move(-1);
        break;
      case 'Home':
        command.setActiveId(available[0]?.id ?? null);
        break;
      case 'End':
        command.setActiveId(available[available.length - 1]?.id ?? null);
        break;
      case 'Enter':
        available.find((option) => option.id === command.activeId)?.click();
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  return (
    <div
      data-slot="command-input-wrapper"
      className="gap-field border-stroke px-row flex items-center border-b"
    >
      <SearchIcon className="text-text-muted size-4" />
      <input
        data-slot="command-input"
        role="combobox"
        aria-expanded={command.hasResults}
        aria-controls={command.listId}
        aria-activedescendant={command.hasResults ? (command.activeId ?? undefined) : undefined}
        aria-autocomplete="list"
        aria-label={label ?? labels.search}
        autoComplete="off"
        spellCheck={false}
        dir="auto"
        placeholder={placeholder ?? labels.placeholder}
        value={command.search}
        onChange={(event) => {
          onChange?.(event);
          command.setSearch(event.target.value);
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          'h-12 min-w-0 flex-1 bg-transparent text-b1 text-text-primary outline-none placeholder:text-text-muted',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  );
}

export { CommandInput };
export type { CommandInputProps };

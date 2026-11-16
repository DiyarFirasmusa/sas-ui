import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { CommandInput, type CommandInputProps } from '@/components/ui/command-input';
import { CommandItem, CommandShortcut, type CommandItemProps } from '@/components/ui/command-item';
import {
  CommandEmpty,
  CommandGroup,
  CommandList,
  CommandLoading,
  CommandSeparator,
  type CommandListProps,
} from '@/components/ui/command-list';
import { CommandContext, type CommandContextValue, type ItemEntry } from '@/hooks/use-command';
import { defaultCommandFilter, type CommandFilter } from '@/lib/command-filter';
import { commandMessages } from '@/lib/command-messages';
import { useLabels } from '@/lib/locale';
import { cn } from '@/lib/utils';

interface CommandProps extends Omit<React.ComponentProps<'div'>, 'onChange'> {
  /** Custom matching. Return 0 to hide an item. Default: every word must appear, accent/diacritic-insensitive. */
  filter?: CommandFilter;
  /** Turn off built-in filtering, e.g. when results come from a server. */
  shouldFilter?: boolean;
  /** Controlled search text. */
  search?: string;
  onSearchChange?: (search: string) => void;
}

/**
 * Searchable, grouped, keyboard-driven list (a command palette). The input is
 * a combobox and keeps focus; the highlighted option is exposed through
 * `aria-activedescendant`. Arrow keys move, Home/End jump, Enter selects.
 */
function Command({
  filter = defaultCommandFilter,
  shouldFilter = true,
  search: controlledSearch,
  onSearchChange,
  className,
  children,
  ...props
}: CommandProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const registry = useRef(new Map<string, ItemEntry>());
  const resetActive = useRef(true);
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const [ownSearch, setOwnSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const search = controlledSearch ?? ownSearch;

  const setSearch = useCallback(
    (next: string) => {
      resetActive.current = true;
      setOwnSearch(next);
      onSearchChange?.(next);
    },
    [onSearchChange],
  );

  const isMatch = (entry: ItemEntry) =>
    !shouldFilter || search.trim() === '' || filter(entry.value, search, entry.keywords) > 0;

  const register = useCallback((id: string, entry: ItemEntry) => {
    registry.current.set(id, entry);
    refresh();
    return () => {
      registry.current.delete(id);
      refresh();
    };
  }, []);

  const options = useCallback(
    () =>
      Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []).filter(
        (option) => option.getAttribute('aria-disabled') !== 'true',
      ),
    [],
  );

  useLayoutEffect(() => setReady(true), []);

  // After every render the highlighted option must still exist; after a new
  // search it always restarts on the first match.
  useLayoutEffect(() => {
    const available = options();
    const stillThere = available.some((option) => option.id === activeId);
    if (resetActive.current || !stillThere) {
      resetActive.current = false;
      const first = available[0]?.id ?? null;
      if (first !== activeId) {
        setActiveId(first);
      }
    }
  });

  useEffect(() => {
    if (activeId) {
      document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeId]);

  const entries = [...registry.current.values()];
  const value: CommandContextValue = {
    listId,
    search,
    setSearch,
    activeId,
    setActiveId,
    hasResults: entries.some(isMatch),
    ready,
    isMatch,
    groupVisible: (group) => {
      const own = entries.filter((entry) => entry.group === group);
      // A group that has not registered yet stays visible, so server HTML and
      // the first paint do not hide it.
      return own.length === 0 || own.some(isMatch);
    },
    register,
    options,
  };

  return (
    <CommandContext value={value}>
      <div
        ref={rootRef}
        data-slot="command"
        className={cn(
          'flex size-full flex-col overflow-hidden rounded-[inherit] bg-popover text-popover-foreground',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </CommandContext>
  );
}

interface CommandDialogProps extends Omit<DialogPrimitive.Root.Props, 'children'> {
  children?: React.ReactNode;
  /** Screen-reader title of the dialog; defaults to "Command palette". */
  title?: string;
  /** Props for the inner `Command` (filter, search…). */
  commandProps?: CommandProps;
}

/** The palette in a modal: open it from a shortcut or a button; Escape closes. */
function CommandDialog({ title, commandProps, children, ...props }: CommandDialogProps) {
  const labels = useLabels(commandMessages);
  return (
    <DialogPrimitive.Root data-slot="command-dialog" {...props}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn(
            'fixed inset-0 z-50 bg-scrim backdrop-blur-[12px] transition-opacity duration-200',
            'data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none',
          )}
        />
        <DialogPrimitive.Popup
          data-slot="command-dialog-content"
          className={cn(
            'fixed start-1/2 top-[10dvh] z-50 flex max-h-[80dvh] w-[calc(100vw-2rem)] max-w-xl ltr:-translate-x-1/2 rtl:translate-x-1/2',
            'rounded-modal border border-stroke-strong bg-surface-elevated text-text-primary shadow-xlarge outline-none',
            'transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            'motion-reduce:transition-none',
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {title ?? labels.palette}
          </DialogPrimitive.Title>
          <Command {...commandProps}>{children}</Command>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandSeparator,
  CommandShortcut,
};
export type {
  CommandDialogProps,
  CommandInputProps,
  CommandItemProps,
  CommandListProps,
  CommandProps,
};

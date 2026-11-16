import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from '@/components/ui/command';
import { SearchIcon } from '@/components/ui/icons';
import { Kbd } from '@/components/ui/kbd';
import { useLabels, type Messages } from '@/lib/locale';
import { flattenNavItems, type NavItem } from '@/lib/nav-utils';
import { cn } from '@/lib/utils';

const messages: Messages<'search' | 'palette'> = {
  en: { search: 'Search', palette: 'Search and commands' },
  ar: { search: 'بحث', palette: 'البحث والأوامر' },
};

interface SearchItem {
  id: string;
  label: string;
  /** Heading the item is listed under; items without one share the first group. */
  group?: string;
  icon?: ReactNode;
  /** Extra words that also match. */
  keywords?: string[];
  href?: string;
}

interface ShellSearchProps {
  items: readonly SearchItem[];
  onSelect: (item: SearchItem) => void;
  /** Controlled open state; the shortcut and the button toggle it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Shows a loading row instead of results, for server-side search. */
  loading?: boolean;
  labels?: Partial<Record<keyof (typeof messages)['en'], string>>;
  className?: string;
}

/** The navigable entries of a nav tree as palette items, so the palette can jump to any page. */
function navSearchItems(items: readonly NavItem[], group?: string): SearchItem[] {
  return flattenNavItems(items)
    .filter((item) => item.href !== undefined && item.disabled !== true)
    .map((item) => ({
      id: item.id,
      label: item.label,
      group,
      icon: item.icon,
      href: item.href,
    }));
}

/** Group items by heading, keeping the order in which each heading first appears. */
function groupItems(
  items: readonly SearchItem[],
): { heading: string | undefined; items: SearchItem[] }[] {
  const groups = new Map<string | undefined, SearchItem[]>();
  items.forEach((item) => {
    groups.set(item.group, [...(groups.get(item.group) ?? []), item]);
  });
  return [...groups].map(([heading, grouped]) => ({ heading, items: grouped }));
}

/** Apple platforms show ⌘; resolved after mount so server and client markup agree. */
function useIsApple(): boolean {
  const [apple, setApple] = useState(false);
  useEffect(() => {
    setApple(/Mac|iPhone|iPad/.test(globalThis.navigator?.userAgent ?? ''));
  }, []);
  return apple;
}

/**
 * Search field-shaped button that opens a command palette; ⌘K / Ctrl+K opens
 * it from anywhere. Below `sm` the button is an icon only.
 */
function ShellSearch({
  items,
  onSelect,
  open: openProp,
  onOpenChange,
  loading = false,
  labels: overrides,
  className,
}: ShellSearchProps) {
  const labels = useLabels(messages, overrides);
  const apple = useIsApple();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, setOpen]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        data-slot="shell-search"
        aria-label={labels.search}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={cn(
          'text-text-muted max-sm:size-11 max-sm:p-0 sm:w-56 sm:justify-start md:w-64',
          className,
        )}
      >
        <SearchIcon />
        <span className="text-b2 flex-1 truncate text-start max-sm:hidden">{labels.search}</span>
        <Kbd keys={apple ? ['⌘', 'K'] : ['Ctrl', 'K']} className="max-md:hidden" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title={labels.palette}>
        <CommandInput />
        <CommandList>
          {loading ? (
            <CommandLoading />
          ) : (
            <>
              <CommandEmpty />
              {groupItems(items).map((group) => (
                <CommandGroup key={group.heading ?? 'items'} heading={group.heading}>
                  {group.items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.label}
                      keywords={item.keywords}
                      onSelect={() => {
                        setOpen(false);
                        onSelect(item);
                      }}
                    >
                      {item.icon}
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

export { navSearchItems, ShellSearch };
export type { SearchItem, ShellSearchProps };

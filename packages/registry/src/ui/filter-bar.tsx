import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FilterField } from '@/components/ui/filter-bar-fields';
import { CloseIcon, FilterIcon, SearchIcon } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  applyFilterValues,
  clearFilters,
  countActiveFilters,
  getFilterChips,
  getSearch,
  groupFilters,
  removeChip,
  setSearch,
  type FilterDefinition,
  type FilterValues,
} from '@/lib/filter-state';
import { fillTemplate, formatCount } from '@/lib/format-message';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<
  | 'search'
  | 'clearSearch'
  | 'filters'
  | 'filtersWithCount'
  | 'apply'
  | 'reset'
  | 'clearAll'
  | 'activeFilters'
  | 'removeChip'
  | 'announce'
  | 'any'
  | 'yes'
  | 'no'
  | 'min'
  | 'max'
  | 'from'
  | 'to'
  | 'chipFrom'
  | 'chipUpTo'
  | 'chipBetween'
  | 'loading'
  | 'loadError'
  | 'retry'
> = {
  en: {
    search: 'Search',
    clearSearch: 'Clear search',
    filters: 'Filters',
    filtersWithCount: 'Filters ({count})',
    apply: 'Apply',
    reset: 'Reset',
    clearAll: 'Clear all',
    activeFilters: 'Active filters',
    removeChip: 'Remove filter {label}: {text}',
    announce: '{count} filters applied',
    any: 'Any',
    yes: 'Yes',
    no: 'No',
    min: 'Min',
    max: 'Max',
    from: 'From',
    to: 'To',
    chipFrom: 'From {value}',
    chipUpTo: 'Up to {value}',
    chipBetween: '{from} – {to}',
    loading: 'Loading filters',
    loadError: 'Could not load the filters.',
    retry: 'Retry',
  },
  ar: {
    search: 'بحث',
    clearSearch: 'مسح البحث',
    filters: 'التصفية',
    filtersWithCount: 'التصفية ({count})',
    apply: 'تطبيق',
    reset: 'إعادة تعيين',
    clearAll: 'مسح الكل',
    activeFilters: 'عوامل التصفية المفعّلة',
    removeChip: 'إزالة عامل التصفية {label}: {text}',
    announce: 'تم تطبيق {count} من عوامل التصفية',
    any: 'الكل',
    yes: 'نعم',
    no: 'لا',
    min: 'الحد الأدنى',
    max: 'الحد الأقصى',
    from: 'من',
    to: 'إلى',
    chipFrom: 'من {value}',
    chipUpTo: 'حتى {value}',
    chipBetween: '{from} – {to}',
    loading: 'جارٍ تحميل عوامل التصفية',
    loadError: 'تعذر تحميل عوامل التصفية.',
    retry: 'إعادة المحاولة',
  },
};

type FilterBarLabels = Partial<Record<keyof (typeof messages)['en'], string>>;

interface FilterBarProps {
  /** Metadata for the filters, usually fetched from the backend. */
  filters: readonly FilterDefinition[];
  /** Search text (under `searchKey`) and the active filters, keyed by `FilterDefinition.key`. */
  value: FilterValues;
  onChange: (value: FilterValues) => void;
  /** Where the search text lives in `value`. It is sent as a filter but never counted as one. Default `q`. */
  searchKey?: string;
  searchPlaceholder?: string;
  /** How long typing must pause before `onChange` fires with the new search text. */
  searchDelay?: number;
  /** The filter metadata is still loading: the Filters button shows a spinner and does not open. */
  loading?: boolean;
  /** The filter metadata failed to load: the panel shows the error with `onRetry`. */
  error?: boolean;
  onRetry?: () => void;
  /** Extra controls after the filters button (export, view switch…). */
  actions?: ReactNode;
  labels?: FilterBarLabels;
  className?: string;
}

/**
 * Search box, a "Filters" panel and the chips of what is applied. Edits in the
 * panel are applied together (so a list is not refetched per keystroke);
 * search is debounced. Everything is a plain `value` record that round-trips
 * through the URL with `serializeFilters` / `parseFilters`.
 */
function FilterBar({
  filters,
  value,
  onChange,
  searchKey = 'q',
  searchPlaceholder,
  searchDelay = 300,
  loading = false,
  error = false,
  onRetry,
  actions,
  labels: labelOverrides,
  className,
}: FilterBarProps) {
  const labels = useLabels(messages, labelOverrides);
  const external = getSearch(value, { searchKey });
  const [text, setText] = useState(external);
  const debounced = useDebouncedValue(text, searchDelay);
  const lastPushed = useRef(external);
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterValues>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const chipsRef = useRef<HTMLUListElement>(null);
  const pendingFocus = useRef<number | null>(null);

  // Push the debounced text up, but only text the user typed: a value that
  // came from outside (clear all, back button) must not be sent back again.
  useEffect(() => {
    if (debounced !== lastPushed.current) {
      lastPushed.current = debounced;
      latest.current.onChange(setSearch(latest.current.value, debounced, { searchKey }));
    }
  }, [debounced, searchKey]);

  // Pull outside changes down into the box without clobbering what is being typed.
  useEffect(() => {
    if (external !== lastPushed.current) {
      lastPushed.current = external;
      setText(external);
    }
  }, [external]);

  const activeCount = countActiveFilters(filters, value);
  const chips = getFilterChips(filters, value, {
    yes: labels.yes,
    no: labels.no,
    from: labels.chipFrom,
    upTo: labels.chipUpTo,
    between: labels.chipBetween,
  });
  const groups = groupFilters(filters);

  useEffect(() => {
    if (pendingFocus.current === null) {
      return;
    }
    const buttons = chipsRef.current?.querySelectorAll<HTMLButtonElement>('button[data-chip]');
    const target =
      buttons && buttons.length > 0
        ? buttons[Math.min(pendingFocus.current, buttons.length - 1)]
        : null;
    (target ?? triggerRef.current)?.focus();
    pendingFocus.current = null;
  }, [chips.length]);

  function commitSearch(next: string) {
    lastPushed.current = next;
    setText(next);
    onChange(setSearch(value, next, { searchKey }));
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft({ ...value });
    }
    setOpen(next);
  }

  const hasPanel = filters.length > 0 || loading || error;

  return (
    <div data-slot="filter-bar" className={cn('flex flex-col gap-field', className)}>
      <div className="gap-field flex flex-wrap items-center">
        <div className="relative min-w-48 flex-1 sm:max-w-sm">
          <SearchIcon className="text-text-muted pointer-events-none absolute start-3 top-1/2 -translate-y-1/2" />
          <Input
            type="search"
            aria-label={labels.search}
            placeholder={searchPlaceholder ?? labels.search}
            value={text}
            className="ps-9 pe-9 [&::-webkit-search-cancel-button]:hidden"
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitSearch(text);
              }
            }}
          />
          {text !== '' ? (
            <button
              type="button"
              aria-label={labels.clearSearch}
              className="text-text-muted hover:bg-hover-row focus-visible:ring-ring absolute end-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm outline-none focus-visible:ring-2"
              onClick={() => commitSearch('')}
            >
              <CloseIcon />
            </button>
          ) : null}
        </div>

        {hasPanel ? (
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger
              ref={triggerRef}
              aria-label={
                activeCount > 0
                  ? fillTemplate(labels.filtersWithCount, {
                      count: formatCount(activeCount),
                    })
                  : undefined
              }
              render={<Button variant="outline" loading={loading} />}
            >
              {loading ? null : <FilterIcon />}
              {labels.filters}
              {activeCount > 0 ? (
                <Badge tone="solid" className="min-w-5 px-1.5 tabular-nums">
                  {formatCount(activeCount)}
                </Badge>
              ) : null}
            </PopoverTrigger>
            <PopoverContent
              align="start"
              aria-label={labels.filters}
              className="w-[min(40rem,calc(100vw-2rem))] p-0"
            >
              {error ? (
                <div
                  role="alert"
                  className="gap-field p-row text-b2 text-danger flex flex-col items-start"
                >
                  <p>{labels.loadError}</p>
                  {onRetry ? (
                    <Button size="sm" variant="outline" onClick={onRetry}>
                      {labels.retry}
                    </Button>
                  ) : null}
                </div>
              ) : (
                <form
                  className="flex flex-col"
                  onSubmit={(event) => {
                    event.preventDefault();
                    onChange(applyFilterValues(filters, value, draft));
                    setOpen(false);
                  }}
                >
                  <div className="gap-row p-row flex max-h-[60vh] flex-col overflow-y-auto">
                    {groups.map((section) => (
                      <section
                        key={section.group ?? ''}
                        aria-label={section.group}
                        className="gap-inline flex flex-col"
                      >
                        {section.group ? (
                          <h3 className="text-h5 text-text-primary">{section.group}</h3>
                        ) : null}
                        <div className="gap-inline grid grid-cols-1 sm:grid-cols-2">
                          {section.filters.map((definition) => (
                            <FilterField
                              key={definition.key}
                              definition={definition}
                              value={draft[definition.key]}
                              labels={labels}
                              onChange={(next) =>
                                setDraft((previous) => ({
                                  ...previous,
                                  [definition.key]: next,
                                }))
                              }
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                  <div className="gap-field border-stroke p-inline flex items-center justify-end border-t">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setDraft(clearFilters(filters, draft))}
                    >
                      {labels.reset}
                    </Button>
                    <Button type="submit">{labels.apply}</Button>
                  </div>
                </form>
              )}
            </PopoverContent>
          </Popover>
        ) : null}
        {actions}
      </div>

      {chips.length > 0 ? (
        <div className="gap-field flex flex-wrap items-center">
          <ul
            ref={chipsRef}
            aria-label={labels.activeFilters}
            className="gap-field flex flex-wrap items-center"
          >
            {chips.map((chip, index) => (
              <li key={chip.id}>
                <span
                  data-slot="filter-chip"
                  className="rounded-pill bg-primary-light ps-inline text-b2 text-primary-text inline-flex min-h-7 items-center gap-1 pe-1"
                >
                  <span className="text-text-secondary">{chip.label}:</span>
                  <span className="max-w-48 truncate" dir="auto">
                    {chip.text}
                  </span>
                  <button
                    type="button"
                    data-chip=""
                    aria-label={fillTemplate(labels.removeChip, {
                      label: chip.label,
                      text: chip.text,
                    })}
                    className="rounded-pill hover:bg-surface focus-visible:ring-ring flex size-6 items-center justify-center outline-none focus-visible:ring-2"
                    onClick={() => {
                      pendingFocus.current = index;
                      onChange(removeChip(value, chip));
                    }}
                  >
                    <CloseIcon className="size-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              pendingFocus.current = 0;
              onChange(clearFilters(filters, value));
            }}
          >
            {labels.clearAll}
          </Button>
        </div>
      ) : null}
      <span role="status" className="sr-only">
        {activeCount > 0 ? fillTemplate(labels.announce, { count: formatCount(activeCount) }) : ''}
      </span>
    </div>
  );
}

export { FilterBar };
export type { FilterBarLabels, FilterBarProps };

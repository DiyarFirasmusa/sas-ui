import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { useRef, useState, type FocusEventHandler, type Ref } from 'react';
import {
  ComboboxContent,
  comboboxGroupClasses,
  type ComboboxAsyncProps,
} from '@/components/ui/combobox';
import { ChevronDownIcon, CloseIcon } from '@/components/ui/icons';
import {
  fillLabel,
  optionFor,
  rememberOptions,
  withSelected,
  type ComboboxOption,
} from '@/lib/combobox-options';
import { useLabels, useLocale, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

type MultiSelectLabelKey =
  | 'clear'
  | 'open'
  | 'loading'
  | 'empty'
  | 'error'
  | 'retry'
  | 'loadMore'
  | 'remove'
  | 'showMore'
  | 'showLess'
  | 'selectedCount';

const messages: Messages<MultiSelectLabelKey> = {
  en: {
    clear: 'Clear all',
    open: 'Open options',
    loading: 'Loading…',
    empty: 'No results',
    error: 'Could not load results',
    retry: 'Try again',
    loadMore: 'Load more',
    remove: 'Remove {label}',
    showMore: 'Show {count} more',
    showLess: 'Show less',
    selectedCount: '{count} selected',
  },
  ar: {
    clear: 'مسح الكل',
    open: 'فتح الخيارات',
    loading: 'جارٍ التحميل…',
    empty: 'لا توجد نتائج',
    error: 'تعذر تحميل النتائج',
    retry: 'إعادة المحاولة',
    loadMore: 'تحميل المزيد',
    remove: 'إزالة {label}',
    showMore: 'عرض {count} أخرى',
    showLess: 'عرض أقل',
    selectedCount: '{count} محدد',
  },
};

const iconButton = cn(
  'inline-flex size-7 shrink-0 items-center justify-center rounded-md text-text-muted outline-none',
  'transition-colors hover:bg-hover-row hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring',
  '[&_svg]:size-4 data-[disabled]:pointer-events-none',
);

interface MultiSelectProps
  extends
    ComboboxAsyncProps,
    Omit<
      ComboboxPrimitive.Root.Props<ComboboxOption, true>,
      | 'items'
      | 'children'
      | 'multiple'
      | 'filter'
      | 'filteredItems'
      | 'value'
      | 'defaultValue'
      | 'onValueChange'
      | 'inputValue'
      | 'defaultInputValue'
      | 'onInputValueChange'
      | 'inputRef'
      | 'itemToStringLabel'
      | 'itemToStringValue'
      | 'isItemEqualToValue'
    > {
  options: readonly ComboboxOption[];
  /** Selected option values. Omit for uncontrolled. */
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  /**
   * Options used only to find the labels of `value` entries that are not in
   * `options` yet, e.g. saved values before the first search returns.
   */
  fallbackOptions?: readonly ComboboxOption[];
  /** Show at most this many chips, then a "+N" button that reveals the rest. */
  maxChips?: number;
  /** Show a button that clears every selection. */
  clearable?: boolean;
  placeholder?: string;
  className?: string;
  /** Reaches the text input, so react-hook-form can focus it on error. */
  ref?: Ref<HTMLInputElement>;
  /** Fires when focus leaves the whole control (input, chips and buttons), not between them. */
  onBlur?: FocusEventHandler<HTMLElement>;
  /** Accessible name when there is no surrounding `Field` label. */
  'aria-label'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
  labels?: Partial<Record<MultiSelectLabelKey, string>>;
}

/**
 * Searchable multiple select. Chosen values show as removable chips (Backspace
 * removes the last, and the Left/Right arrows move between chips following
 * the reading direction). Static `options` filter locally; pass
 * `onSearchChange` for server-side search, with `loading`, `hasMore` /
 * `onLoadMore` and `error` for paging and failures. The value is a list of
 * option `value` strings.
 */
function MultiSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  fallbackOptions,
  onSearchChange,
  loading,
  error,
  hasMore,
  onLoadMore,
  onRetry,
  maxChips,
  clearable = false,
  placeholder,
  className,
  ref,
  onBlur,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  labels: labelOverrides,
  onOpenChange,
  ...props
}: MultiSelectProps) {
  const labels = useLabels(messages, labelOverrides);
  const { direction } = useLocale();
  const [uncontrolled, setUncontrolled] = useState<readonly string[]>(defaultValue ?? []);
  const [expanded, setExpanded] = useState(false);
  const lastQuery = useRef('');
  // Idempotent cache: chosen values keep their label after a new search replaces `options`.
  const memory = useRef(new Map<string, ComboboxOption>());
  rememberOptions(memory.current, options, fallbackOptions);

  const current = value ?? uncontrolled;
  const selected = current.map((entry) => optionFor(memory.current, entry));
  const items = onSearchChange ? withSelected(options, selected) : options;

  function handleBlur(event: React.FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      onBlur?.(event);
    }
  }

  return (
    <DirectionProvider direction={direction}>
      <ComboboxPrimitive.Root
        multiple
        items={items}
        value={selected}
        filter={onSearchChange ? null : undefined}
        itemToStringLabel={(option) => option.label}
        isItemEqualToValue={(item, chosen) => item.value === chosen.value}
        onValueChange={(next) => {
          for (const option of next) {
            memory.current.set(option.value, option);
          }
          const nextValues = next.map((option) => option.value);
          setUncontrolled(nextValues);
          onValueChange?.(nextValues);
        }}
        onInputValueChange={(query, details) => {
          const typing =
            details.reason === 'input-change' ||
            details.reason === 'input-clear' ||
            details.reason === 'clear-press';
          if (onSearchChange && typing && query !== lastQuery.current) {
            lastQuery.current = query;
            onSearchChange(query);
          }
        }}
        onOpenChange={(open, details) => {
          if (!open && onSearchChange && lastQuery.current !== '') {
            lastQuery.current = '';
            onSearchChange('');
          }
          onOpenChange?.(open, details);
        }}
        {...props}
      >
        <ComboboxPrimitive.InputGroup
          data-slot="multi-select"
          onBlur={handleBlur}
          className={cn(
            comboboxGroupClasses,
            'h-auto min-h-9.5 items-start py-1 ps-1.5',
            className,
          )}
        >
          <ComboboxPrimitive.Value>
            {(chosen: ComboboxOption[]) => {
              const limit = maxChips === undefined || expanded ? chosen.length : maxChips;
              const hidden = chosen.length - limit;
              return (
                <ComboboxPrimitive.Chips
                  data-slot="multi-select-chips"
                  className="flex min-w-0 flex-1 flex-wrap items-center gap-1"
                >
                  {chosen.slice(0, limit).map((option) => (
                    <ComboboxPrimitive.Chip
                      key={option.value}
                      data-slot="multi-select-chip"
                      aria-label={option.label}
                      className={cn(
                        'inline-flex h-7 max-w-full items-center gap-1 rounded-md bg-primary-light ps-2 pe-0.5 text-b2 text-primary-text outline-none',
                        'focus-within:ring-2 focus-within:ring-ring data-[highlighted]:ring-2 data-[highlighted]:ring-ring',
                        'data-[disabled]:opacity-50',
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      <ComboboxPrimitive.ChipRemove
                        data-slot="multi-select-chip-remove"
                        aria-label={fillLabel(labels.remove, {
                          label: option.label,
                        })}
                        className="hover:bg-primary-tint focus-visible:ring-ring inline-flex size-6 shrink-0 items-center justify-center rounded-md outline-none focus-visible:ring-2 [&_svg]:size-3.5"
                      >
                        <CloseIcon />
                      </ComboboxPrimitive.ChipRemove>
                    </ComboboxPrimitive.Chip>
                  ))}
                  {maxChips !== undefined && chosen.length > maxChips ? (
                    <button
                      type="button"
                      data-slot="multi-select-overflow"
                      aria-expanded={expanded}
                      aria-label={
                        expanded ? labels.showLess : fillLabel(labels.showMore, { count: hidden })
                      }
                      onClick={() => setExpanded((open) => !open)}
                      className="bg-surface-dim text-b2 text-text-secondary hover:bg-hover-row focus-visible:ring-ring inline-flex h-7 items-center rounded-md px-2 tabular-nums outline-none focus-visible:ring-2"
                    >
                      {expanded ? labels.showLess : `+${hidden}`}
                    </button>
                  ) : null}
                  <ComboboxPrimitive.Input
                    ref={ref}
                    placeholder={chosen.length === 0 ? placeholder : undefined}
                    aria-label={ariaLabel}
                    aria-invalid={ariaInvalid}
                    aria-description={
                      chosen.length > 0
                        ? fillLabel(labels.selectedCount, {
                            count: chosen.length,
                          })
                        : undefined
                    }
                    data-slot="multi-select-input"
                    className="text-b1 text-text-primary placeholder:text-text-muted h-7 min-w-16 flex-1 bg-transparent outline-none disabled:cursor-not-allowed"
                  />
                </ComboboxPrimitive.Chips>
              );
            }}
          </ComboboxPrimitive.Value>
          {clearable && current.length > 0 ? (
            <ComboboxPrimitive.Clear
              data-slot="multi-select-clear"
              aria-label={labels.clear}
              className={iconButton}
            >
              <CloseIcon />
            </ComboboxPrimitive.Clear>
          ) : null}
          <ComboboxPrimitive.Trigger
            data-slot="multi-select-trigger"
            aria-label={labels.open}
            tabIndex={-1}
            className={iconButton}
          >
            <ChevronDownIcon />
          </ComboboxPrimitive.Trigger>
        </ComboboxPrimitive.InputGroup>
        <ComboboxContent
          labels={labels}
          loading={loading}
          error={error}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          onRetry={onRetry}
        />
      </ComboboxPrimitive.Root>
    </DirectionProvider>
  );
}

export { MultiSelect };
export type { MultiSelectProps };

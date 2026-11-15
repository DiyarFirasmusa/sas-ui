import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { useRef, useState, type FocusEventHandler, type Ref, type UIEvent } from 'react';
import { CheckIcon, ChevronDownIcon, CloseIcon, LoaderIcon } from '@/components/ui/icons';
import { controlClasses } from '@/components/ui/input';
import {
  optionFor,
  rememberOptions,
  withSelected,
  type ComboboxOption,
} from '@/lib/combobox-options';
import { useLabels, useLocale, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

type ComboboxLabelKey = 'clear' | 'open' | 'loading' | 'empty' | 'error' | 'retry' | 'loadMore';

const messages: Messages<ComboboxLabelKey> = {
  en: {
    clear: 'Clear',
    open: 'Open options',
    loading: 'Loading…',
    empty: 'No results',
    error: 'Could not load results',
    retry: 'Try again',
    loadMore: 'Load more',
  },
  ar: {
    clear: 'مسح',
    open: 'فتح الخيارات',
    loading: 'جارٍ التحميل…',
    empty: 'لا توجد نتائج',
    error: 'تعذر تحميل النتائج',
    retry: 'إعادة المحاولة',
    loadMore: 'تحميل المزيد',
  },
};

/** How close to the bottom (px) the list must scroll before the next page loads. */
const LOAD_MORE_THRESHOLD = 48;

/** State shared by every combobox-style list: async search, paging, errors. */
interface ComboboxAsyncProps {
  /**
   * Called with the typed query (and `''` when it is cleared or the popup
   * closes). When set, the component stops filtering locally: pass the
   * matching `options` back, usually after a debounce in the caller.
   */
  onSearchChange?: (query: string) => void;
  /** Shows a loading row; keeps the current options visible while the next page loads. */
  loading?: boolean;
  /** Shows the error row instead of the empty state. */
  error?: boolean;
  /** More pages exist: shows "Load more" and loads on scrolling to the end. */
  hasMore?: boolean;
  onLoadMore?: () => void;
  /** Adds a "Try again" button to the error row. */
  onRetry?: () => void;
}

interface ComboboxContentProps extends Pick<
  ComboboxAsyncProps,
  'loading' | 'error' | 'hasMore' | 'onLoadMore' | 'onRetry'
> {
  labels: Record<'loading' | 'empty' | 'error' | 'retry' | 'loadMore', string>;
}

const rowClasses = 'flex items-center gap-field px-inline py-2 text-b2';

/**
 * The popup shared by `Combobox` and `MultiSelect`: option list plus the
 * loading, error, empty and "load more" rows. Must sit inside a
 * `ComboboxPrimitive.Root` that was given `items`.
 */
function ComboboxContent({
  labels,
  loading,
  error,
  hasMore,
  onLoadMore,
  onRetry,
}: ComboboxContentProps) {
  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const list = event.currentTarget;
    const nearEnd = list.scrollHeight - list.scrollTop - list.clientHeight < LOAD_MORE_THRESHOLD;
    if (hasMore && nearEnd && !loading && !error) {
      onLoadMore?.();
    }
  }

  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner sideOffset={4} className="z-50 outline-none">
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          aria-busy={loading || undefined}
          className={cn(
            'w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin)',
            'rounded-lg border border-stroke bg-popover text-popover-foreground shadow-large outline-none',
            'transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            'motion-reduce:transition-none',
          )}
        >
          <div onScroll={handleScroll} className="max-h-72 overflow-y-auto overscroll-contain p-1">
            <ComboboxPrimitive.List>
              {(option: ComboboxOption) => (
                <ComboboxPrimitive.Item
                  key={option.value}
                  value={option}
                  disabled={option.disabled}
                  data-slot="combobox-item"
                  className={cn(
                    'relative flex min-h-9 cursor-default items-center gap-field rounded-md ps-8 pe-inline text-b1 outline-none select-none',
                    'data-[highlighted]:bg-hover-row data-[disabled]:opacity-50',
                  )}
                >
                  <ComboboxPrimitive.ItemIndicator className="absolute start-2 flex items-center">
                    <CheckIcon className="text-primary-text size-4" />
                  </ComboboxPrimitive.ItemIndicator>
                  <span className="truncate">{option.label}</span>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
            <ComboboxPrimitive.Status>
              {loading ? (
                <div className={cn(rowClasses, 'text-text-muted')}>
                  <LoaderIcon className="size-4 animate-spin motion-reduce:animate-none" />
                  {labels.loading}
                </div>
              ) : error ? (
                <div className={cn(rowClasses, 'text-danger')}>{labels.error}</div>
              ) : null}
            </ComboboxPrimitive.Status>
            <ComboboxPrimitive.Empty>
              {!loading && !error ? (
                <div className={cn(rowClasses, 'text-text-muted')}>{labels.empty}</div>
              ) : null}
            </ComboboxPrimitive.Empty>
            {error && onRetry ? <ListButton onClick={onRetry}>{labels.retry}</ListButton> : null}
            {hasMore && onLoadMore && !loading && !error ? (
              <ListButton onClick={onLoadMore}>{labels.loadMore}</ListButton>
            ) : null}
          </div>
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ListButton({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      // Keep focus in the input so typing continues after the click.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        'flex min-h-9 w-full items-center justify-center rounded-md px-inline text-button-2 text-primary-text outline-none',
        'hover:bg-hover-row focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      {children}
    </button>
  );
}

const iconButton = cn(
  'inline-flex size-7 shrink-0 items-center justify-center rounded-md text-text-muted outline-none',
  'transition-colors hover:bg-hover-row hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring',
  '[&_svg]:size-4 data-[disabled]:pointer-events-none',
);

/** Classes for the field-like group that holds the input and its buttons. */
const comboboxGroupClasses = cn(
  controlClasses,
  'gap-1 pe-1',
  'focus-within:border-primary-highlight focus-within:ring-2 focus-within:ring-ring/40',
  'has-[input[aria-invalid=true]]:border-danger has-[input[aria-invalid=true]]:ring-danger/30',
  'data-[disabled]:cursor-not-allowed data-[disabled]:bg-disabled-container data-[disabled]:text-text-inactive',
);

interface ComboboxProps
  extends
    ComboboxAsyncProps,
    Omit<
      ComboboxPrimitive.Root.Props<ComboboxOption, false>,
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
  /** Selected option value; `null` for none. Omit for uncontrolled. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /**
   * Options used only to find the label of `value` when it is not in
   * `options` yet, e.g. a saved value before the first search returns.
   */
  fallbackOptions?: readonly ComboboxOption[];
  /** Show a button that clears the selection. */
  clearable?: boolean;
  placeholder?: string;
  className?: string;
  /** Reaches the text input, so react-hook-form can focus it on error. */
  ref?: Ref<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  /** Accessible name when there is no surrounding `Field` label. */
  'aria-label'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
  labels?: Partial<Record<ComboboxLabelKey, string>>;
}

/**
 * Searchable single select. With static `options` it filters as you type.
 * For server-side search pass `onSearchChange` and feed back the matching
 * `options`; add `loading`, `hasMore`/`onLoadMore` and `error` for paging and
 * failures. The form value is the option's `value` string.
 */
function Combobox({
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
}: ComboboxProps) {
  const labels = useLabels(messages, labelOverrides);
  const { direction } = useLocale();
  const [uncontrolled, setUncontrolled] = useState<string | null>(defaultValue ?? null);
  const [hasText, setHasText] = useState(false);
  const lastQuery = useRef('');
  // Idempotent cache: lets a chosen value keep its label after a new search replaces `options`.
  const memory = useRef(new Map<string, ComboboxOption>());
  rememberOptions(memory.current, options, fallbackOptions);

  const current = value === undefined ? uncontrolled : value;
  const selected = current === null ? null : optionFor(memory.current, current);
  const items = onSearchChange && selected ? withSelected(options, [selected]) : options;

  return (
    <DirectionProvider direction={direction}>
      <ComboboxPrimitive.Root
        items={items}
        value={selected}
        filter={onSearchChange ? null : undefined}
        itemToStringLabel={(option) => option.label}
        isItemEqualToValue={(item, chosen) => item.value === chosen.value}
        onValueChange={(next) => {
          const nextValue = next?.value ?? null;
          if (next) {
            memory.current.set(next.value, next);
          }
          setUncontrolled(nextValue);
          onValueChange?.(nextValue);
        }}
        onInputValueChange={(query, details) => {
          setHasText(query !== '');
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
          // Closing resets the input to the chosen label, so reload the unfiltered list.
          if (!open && onSearchChange && lastQuery.current !== '') {
            lastQuery.current = '';
            onSearchChange('');
          }
          onOpenChange?.(open, details);
        }}
        {...props}
      >
        <ComboboxPrimitive.InputGroup
          data-slot="combobox"
          className={cn(comboboxGroupClasses, className)}
        >
          <ComboboxPrimitive.Input
            ref={ref}
            onBlur={onBlur}
            placeholder={placeholder}
            aria-label={ariaLabel}
            aria-invalid={ariaInvalid}
            dir={hasText || selected ? 'auto' : undefined}
            data-slot="combobox-input"
            className="text-b1 text-text-primary placeholder:text-text-muted h-full min-w-0 flex-1 bg-transparent outline-none disabled:cursor-not-allowed"
          />
          {clearable ? (
            <ComboboxPrimitive.Clear
              data-slot="combobox-clear"
              aria-label={labels.clear}
              className={cn(iconButton, 'data-[hidden]:hidden')}
            >
              <CloseIcon />
            </ComboboxPrimitive.Clear>
          ) : null}
          <ComboboxPrimitive.Trigger
            data-slot="combobox-trigger"
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

export { Combobox, ComboboxContent, comboboxGroupClasses };
export type { ComboboxAsyncProps, ComboboxContentProps, ComboboxOption, ComboboxProps };

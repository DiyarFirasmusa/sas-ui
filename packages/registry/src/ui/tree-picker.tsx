import { useMemo, useState, type FocusEventHandler, type Ref } from 'react';
import { CloseIcon, ChevronDownIcon, SearchIcon } from '@/components/ui/icons';
import { Input, controlClasses } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tree, type TreeLabels } from '@/components/ui/tree';
import { fillTemplate, formatCount } from '@/lib/format-message';
import { useLabels, type Messages } from '@/lib/locale';
import {
  collapseChecked,
  filterTree,
  findNode,
  findPath,
  getAncestorIds,
  normalizeChecked,
  type TreeNode,
} from '@/lib/tree-utils';
import { cn } from '@/lib/utils';

const messages: Messages<
  'placeholder' | 'search' | 'clear' | 'noResults' | 'selectedCount' | 'tree' | 'listSeparator'
> = {
  en: {
    placeholder: 'Select…',
    search: 'Search',
    clear: 'Clear selection',
    noResults: 'No results',
    selectedCount: '{count} selected',
    tree: 'Options',
    listSeparator: ', ',
  },
  ar: {
    placeholder: 'اختر…',
    search: 'بحث',
    clear: 'مسح الاختيار',
    noResults: 'لا توجد نتائج',
    selectedCount: 'تم اختيار {count}',
    tree: 'الخيارات',
    listSeparator: '، ',
  },
};

type TreePickerLabels = Partial<Record<keyof (typeof messages)['en'], string>>;

interface TreePickerCommonProps<TData> {
  nodes: readonly TreeNode<TData>[];
  /** Text for a selected id that is not in `nodes` yet (a lazily loaded branch). */
  valueLabel?: string;
  placeholder?: string;
  /** Show the clear button while something is selected. Default true. */
  clearable?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  /** Joins the labels of a selected path, for example "Head office / Finance". */
  pathSeparator?: string;
  loadChildren?: (node: TreeNode<TData>) => Promise<TreeNode<TData>[]>;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  labels?: TreePickerLabels;
  treeLabels?: TreeLabels;
  id?: string;
  name?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
  ref?: Ref<HTMLButtonElement>;
  className?: string;
}

interface TreePickerSingleProps<TData> extends TreePickerCommonProps<TData> {
  multiple?: false;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
}

interface TreePickerMultipleProps<TData> extends TreePickerCommonProps<TData> {
  /**
   * Shows checkboxes. The value lists the highest fully checked nodes (a
   * checked branch means everything below it); with `loadChildren` it lists
   * every checked id.
   */
  multiple: true;
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
}

type TreePickerProps<TData = unknown> = TreePickerSingleProps<TData> | TreePickerMultipleProps<TData>;

/**
 * Popover picker for hierarchies of any depth (organisation units, categories,
 * locations). The trigger shows the selected path, the panel has a search that
 * keeps ancestors of every hit, and the tree inside is fully keyboard operable.
 */
function TreePicker<TData = unknown>(props: TreePickerProps<TData>) {
  const {
    nodes,
    valueLabel,
    placeholder,
    clearable = true,
    searchable = true,
    disabled = false,
    invalid = false,
    pathSeparator = ' / ',
    loadChildren,
    loading,
    error,
    onRetry,
    labels: labelOverrides,
    treeLabels,
    id,
    name,
    onBlur,
    ref,
    className,
  } = props;
  const labels = useLabels(messages, labelOverrides);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const [innerSingle, setInnerSingle] = useState<string | null>(props.multiple ? null : (props.defaultValue ?? null));
  const [innerMultiple, setInnerMultiple] = useState<readonly string[]>(props.multiple ? (props.defaultValue ?? []) : []);

  const singleValue = props.multiple ? null : props.value === undefined ? innerSingle : props.value;
  const multipleValue = props.multiple ? (props.value === undefined ? innerMultiple : props.value) : [];
  const hasValue = props.multiple ? multipleValue.length > 0 : singleValue !== null;

  const filtered = useMemo(() => filterTree(nodes, query), [nodes, query]);
  const isSearching = query.trim() !== '';

  function changeSingle(next: string | null) {
    if (!props.multiple) {
      setInnerSingle(next);
      props.onValueChange?.(next);
    }
  }

  function changeMultiple(ids: readonly string[]) {
    if (props.multiple) {
      // Loaded lazy children are unknown here, so list every id in that case.
      const next = loadChildren ? [...ids] : collapseChecked(nodes, ids);
      setInnerMultiple(next);
      props.onValueChange?.(next);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      const target = props.multiple ? multipleValue : singleValue ? [singleValue] : [];
      const opened = new Set(expanded);
      for (const targetId of target) {
        getAncestorIds(nodes, targetId).forEach((ancestor) => opened.add(ancestor));
      }
      if (nodes.length === 1 && nodes[0]) {
        opened.add(nodes[0].id);
      }
      setExpanded([...opened]);
    } else {
      setQuery('');
    }
  }

  function handleSearch(value: string) {
    setQuery(value);
    // Open every ancestor of a hit so the matches are visible without clicking.
    setExpanded(value.trim() ? [...filterTree(nodes, value).ancestorIds] : []);
  }

  function clear() {
    if (props.multiple) {
      changeMultiple([]);
    } else {
      changeSingle(null);
    }
  }

  const summary = (() => {
    if (!props.multiple) {
      if (singleValue === null) {
        return null;
      }
      const path = findPath(nodes, singleValue);
      return path ? path.map((node) => node.label).join(pathSeparator) : (valueLabel ?? singleValue);
    }
    if (multipleValue.length === 0) {
      return null;
    }
    const shown = loadChildren ? multipleValue : collapseChecked(nodes, multipleValue);
    const labelsOf = shown.map((value) => findNode(nodes, value)?.label ?? value);
    return labelsOf.length <= 2
      ? labelsOf.join(labels.listSeparator)
      : fillTemplate(labels.selectedCount, { count: formatCount(labelsOf.length) });
  })();

  return (
    <div data-slot="tree-picker" className={cn('relative w-full', className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          ref={ref}
          id={id}
          disabled={disabled}
          onBlur={onBlur}
          aria-label={props['aria-label']}
          aria-labelledby={props['aria-labelledby']}
          aria-invalid={invalid || undefined}
          data-invalid={invalid ? '' : undefined}
          className={cn(
            controlClasses,
            'cursor-pointer justify-between text-start data-[popup-open]:border-primary-highlight',
            clearable && hasValue && 'pe-16',
          )}
        >
          <span dir="auto" className={cn('min-w-0 flex-1 truncate', summary === null && 'text-text-muted')}>
            {summary ?? placeholder ?? labels.placeholder}
          </span>
          <ChevronDownIcon className="text-text-muted" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          aria-label={props['aria-labelledby'] ? undefined : (props['aria-label'] ?? labels.tree)}
          aria-labelledby={props['aria-labelledby']}
          className="flex w-(--anchor-width) min-w-72 flex-col gap-field p-field"
        >
          {searchable ? (
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                type="search"
                aria-label={labels.search}
                placeholder={labels.search}
                value={query}
                className="ps-9"
                onChange={(event) => handleSearch(event.target.value)}
              />
            </div>
          ) : null}
          <div className="max-h-64 overflow-y-auto">
            <Tree<TData>
              aria-label={labels.tree}
              nodes={filtered.nodes}
              checkNodes={isSearching ? nodes : undefined}
              expanded={expanded}
              onExpandedChange={setExpanded}
              loadChildren={loadChildren}
              loading={loading}
              error={error}
              onRetry={onRetry}
              labels={{ empty: labels.noResults, ...treeLabels }}
              {...(props.multiple
                ? {
                    checkable: true,
                    checked: [...normalizeChecked(nodes, multipleValue)],
                    onCheckedChange: changeMultiple,
                  }
                : {
                    selectionMode: 'single' as const,
                    selected: singleValue ? [singleValue] : [],
                    onSelectedChange: (ids: string[]) => {
                      changeSingle(ids[0] ?? null);
                      handleOpenChange(false);
                    },
                  })}
            />
          </div>
        </PopoverContent>
      </Popover>
      {clearable && hasValue && !disabled ? (
        <button
          type="button"
          aria-label={labels.clear}
          data-slot="tree-picker-clear"
          className={cn(
            'absolute end-9 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-text-muted outline-none',
            'hover:bg-hover-row hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring',
          )}
          onClick={clear}
        >
          <CloseIcon />
        </button>
      ) : null}
      {name ? (
        <input
          type="hidden"
          name={name}
          value={props.multiple ? multipleValue.join(',') : (singleValue ?? '')}
        />
      ) : null}
    </div>
  );
}

export { TreePicker };
export type { TreePickerLabels, TreePickerProps };

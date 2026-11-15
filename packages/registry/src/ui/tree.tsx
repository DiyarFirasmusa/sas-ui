import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Button } from '@/components/ui/button';
import { CheckIcon, ChevronDownIcon, ChevronRightIcon, LoaderIcon, MinusIcon } from '@/components/ui/icons';
import { useLabels, useLocale, type Messages } from '@/lib/locale';
import {
  attachChildren,
  flattenTree,
  getCheckStates,
  toggleChecked,
  type CheckState,
  type FlatTreeNode,
  type TreeNode,
} from '@/lib/tree-utils';
import { cn } from '@/lib/utils';

const messages: Messages<
  'tree' | 'empty' | 'loading' | 'loadError' | 'retry' | 'loadingChildren' | 'childrenError'
> = {
  en: {
    tree: 'Tree',
    empty: 'Nothing to show',
    loading: 'Loading',
    loadError: 'Could not load the items.',
    retry: 'Retry',
    loadingChildren: 'Loading…',
    childrenError: 'Could not load. Press Enter to retry.',
  },
  ar: {
    tree: 'شجرة',
    empty: 'لا يوجد ما يمكن عرضه',
    loading: 'جارٍ التحميل',
    loadError: 'تعذر تحميل العناصر.',
    retry: 'إعادة المحاولة',
    loadingChildren: 'جارٍ التحميل…',
    childrenError: 'تعذر التحميل. اضغط Enter لإعادة المحاولة.',
  },
};

type TreeLabels = Partial<Record<keyof (typeof messages)['en'], string>>;

interface TreeNodeState {
  depth: number;
  expanded: boolean;
  selected: boolean;
  checkState: CheckState;
}

type TreeRow<TData> =
  | { kind: 'node'; id: string; flat: FlatTreeNode<TData> }
  | { kind: 'status'; id: string; parentId: string; depth: number; state: 'loading' | 'error' };

interface TreeProps<TData = unknown> {
  nodes: readonly TreeNode<TData>[];
  /**
   * The complete tree behind a filtered `nodes` view. Check states and
   * toggles are computed on it, so a parent never looks fully checked just
   * because its unchecked children are hidden by a search.
   */
  checkNodes?: readonly TreeNode<TData>[];
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Expanded node ids (controlled). */
  expanded?: readonly string[];
  defaultExpanded?: readonly string[];
  onExpandedChange?: (ids: string[]) => void;
  /**
   * What activating a row does when `checkable` is off: `single` and `multiple`
   * select it, `none` just opens and closes branches (navigation trees).
   */
  selectionMode?: 'none' | 'single' | 'multiple';
  selected?: readonly string[];
  defaultSelected?: readonly string[];
  onSelectedChange?: (ids: string[]) => void;
  /**
   * Shows tri-state checkboxes. Checking a branch checks everything below it,
   * and a branch is checked only when all of its children are. The ids passed
   * to `onCheckedChange` include the branches; use `collapseChecked` for the
   * shortest list.
   */
  checkable?: boolean;
  checked?: readonly string[];
  defaultChecked?: readonly string[];
  onCheckedChange?: (ids: string[]) => void;
  /** Loads the children of a node that has `hasChildren: true` and no `children`. */
  loadChildren?: (node: TreeNode<TData>) => Promise<TreeNode<TData>[]>;
  /** Replaces the row content (the label). The chevron and checkbox stay. */
  renderNode?: (node: TreeNode<TData>, state: TreeNodeState) => ReactNode;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  labels?: TreeLabels;
  className?: string;
}

function useControllable<T>(value: T | undefined, initial: T, onChange?: (next: T) => void) {
  const [inner, setInner] = useState<T>(initial);
  const current = value === undefined ? inner : value;
  const update = useCallback(
    (next: T) => {
      if (value === undefined) {
        setInner(next);
      }
      onChange?.(next);
    },
    [value, onChange],
  );
  return [current, update] as const;
}

const EMPTY_IDS: readonly string[] = [];

/**
 * Accessible tree (WAI-ARIA tree pattern) of any depth. Arrow keys move,
 * Right/Left open and close (mirrored in RTL), Home/End jump, Enter and Space
 * activate. Rows are flat `treeitem`s with `aria-level`, so the list stays
 * cheap to render and navigate.
 */
function Tree<TData = unknown>({
  nodes,
  checkNodes,
  expanded: expandedProp,
  defaultExpanded = EMPTY_IDS,
  onExpandedChange,
  selectionMode = 'single',
  selected: selectedProp,
  defaultSelected = EMPTY_IDS,
  onSelectedChange,
  checkable = false,
  checked: checkedProp,
  defaultChecked = EMPTY_IDS,
  onCheckedChange,
  loadChildren,
  renderNode,
  loading = false,
  error = false,
  onRetry,
  labels: labelOverrides,
  className,
  ...ariaProps
}: TreeProps<TData>) {
  const labels = useLabels(messages, labelOverrides);
  const { direction } = useLocale();
  const [expandedIds, setExpandedIds] = useControllable<readonly string[]>(
    expandedProp,
    defaultExpanded,
    onExpandedChange ? (ids) => onExpandedChange([...ids]) : undefined,
  );
  const [selectedIds, setSelectedIds] = useControllable<readonly string[]>(
    selectedProp,
    defaultSelected,
    onSelectedChange ? (ids) => onSelectedChange([...ids]) : undefined,
  );
  const [checkedIds, setCheckedIds] = useControllable<readonly string[]>(
    checkedProp,
    defaultChecked,
    onCheckedChange ? (ids) => onCheckedChange([...ids]) : undefined,
  );

  const [loaded, setLoaded] = useState<Record<string, TreeNode<TData>[]>>({});
  const [status, setStatus] = useState<Record<string, 'loading' | 'error'>>({});
  const requested = useRef(new Set<string>());
  const [activeId, setActiveId] = useState<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());

  const effectiveNodes = useMemo(() => attachChildren(nodes, loaded), [nodes, loaded]);
  const expandedSet = useMemo(() => new Set(expandedIds), [expandedIds]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const checkBase = useMemo(
    () => (checkNodes ? attachChildren(checkNodes, loaded) : effectiveNodes),
    [checkNodes, effectiveNodes, loaded],
  );
  const checkStates = useMemo(
    () => (checkable ? getCheckStates(checkBase, checkedIds) : new Map<string, CheckState>()),
    [checkable, checkBase, checkedIds],
  );

  const rows = useMemo(() => {
    const result: TreeRow<TData>[] = [];
    for (const flat of flattenTree(effectiveNodes, expandedSet)) {
      result.push({ kind: 'node', id: flat.node.id, flat });
      const state = status[flat.node.id];
      if (flat.expanded && state) {
        result.push({
          kind: 'status',
          id: `${flat.node.id}::${state}`,
          parentId: flat.node.id,
          depth: flat.depth + 1,
          state,
        });
      }
    }
    return result;
  }, [effectiveNodes, expandedSet, status]);

  const load = useCallback(
    (node: TreeNode<TData>) => {
      if (!loadChildren || requested.current.has(node.id)) {
        return;
      }
      requested.current.add(node.id);
      setStatus((previous) => ({ ...previous, [node.id]: 'loading' }));
      loadChildren(node).then(
        (children) => {
          setLoaded((previous) => ({ ...previous, [node.id]: children }));
          setStatus(({ [node.id]: _done, ...rest }) => rest);
        },
        () => {
          requested.current.delete(node.id);
          setStatus((previous) => ({ ...previous, [node.id]: 'error' }));
        },
      );
    },
    [loadChildren],
  );

  // Loads lazy branches as soon as they are open, however they were opened
  // (click, keyboard or a defaultExpanded id).
  useEffect(() => {
    for (const row of rows) {
      if (row.kind !== 'node' || !row.flat.expanded) {
        continue;
      }
      const { node } = row.flat;
      if (node.hasChildren && !node.children && !status[node.id]) {
        load(node);
      }
    }
  }, [rows, status, load]);

  const tabStopId = useMemo(() => {
    if (activeId !== null && rows.some((row) => row.id === activeId)) {
      return activeId;
    }
    const firstSelected = rows.find((row) => row.kind === 'node' && selectedSet.has(row.id));
    return (firstSelected ?? rows[0])?.id ?? null;
  }, [activeId, rows, selectedSet]);

  function setExpanded(id: string, open: boolean) {
    const next = new Set(expandedSet);
    if (open) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setExpandedIds([...next]);
  }

  function retry(parentId: string) {
    requested.current.delete(parentId);
    setStatus(({ [parentId]: _cleared, ...rest }) => rest);
  }

  function activate(row: TreeRow<TData>) {
    if (row.kind === 'status') {
      if (row.state === 'error') {
        retry(row.parentId);
      }
      return;
    }
    const { node } = row.flat;
    if (node.disabled) {
      return;
    }
    if (checkable) {
      setCheckedIds([...toggleChecked(checkBase, checkedIds, node.id)]);
    } else if (selectionMode === 'single') {
      setSelectedIds([node.id]);
    } else if (selectionMode === 'multiple') {
      setSelectedIds(selectedSet.has(node.id) ? selectedIds.filter((id) => id !== node.id) : [...selectedIds, node.id]);
    } else if (row.flat.isBranch) {
      setExpanded(node.id, !row.flat.expanded);
    }
  }

  function focusRow(index: number) {
    const target = rows[index];
    if (target) {
      setActiveId(target.id);
      itemRefs.current.get(target.id)?.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>, index: number) {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const row = rows[index];
    if (!row) {
      return;
    }
    const opens = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const closes = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    const flat = row.kind === 'node' ? row.flat : null;
    const parentId = row.kind === 'node' ? row.flat.parentId : row.parentId;
    let handled = true;

    if (event.key === 'ArrowDown') {
      focusRow(index + 1);
    } else if (event.key === 'ArrowUp') {
      focusRow(index - 1);
    } else if (event.key === 'Home') {
      focusRow(0);
    } else if (event.key === 'End') {
      focusRow(rows.length - 1);
    } else if (event.key === opens) {
      if (flat?.isBranch && !flat.expanded) {
        setExpanded(flat.node.id, true);
      } else if (flat?.isBranch) {
        focusRow(index + 1);
      }
    } else if (event.key === closes) {
      if (flat?.isBranch && flat.expanded) {
        setExpanded(flat.node.id, false);
      } else if (parentId !== null) {
        focusRow(rows.findIndex((candidate) => candidate.kind === 'node' && candidate.id === parentId));
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      activate(row);
    } else {
      handled = false;
    }
    if (handled) {
      event.preventDefault();
    }
  }

  if (loading) {
    return (
      <div role="status" aria-busy="true" aria-label={labels.loading} data-slot="tree-loading" className={cn('flex flex-col gap-field p-field', className)}>
        {[70, 55, 80, 45].map((width, index) => (
          <div
            key={width}
            className="h-5 animate-pulse rounded-md bg-surface-dim motion-reduce:animate-none"
            style={{ width: `${width}%`, marginInlineStart: index % 2 === 1 ? '1.25rem' : undefined }}
          />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div role="alert" data-slot="tree-error" className={cn('flex flex-col items-start gap-field p-row text-b2 text-danger', className)}>
        <p>{labels.loadError}</p>
        {onRetry ? (
          <Button size="sm" variant="outline" onClick={onRetry}>
            {labels.retry}
          </Button>
        ) : null}
      </div>
    );
  }
  if (nodes.length === 0) {
    return (
      <p data-slot="tree-empty" className={cn('p-row text-center text-b2 text-text-muted', className)}>
        {labels.empty}
      </p>
    );
  }

  return (
    <div
      role="tree"
      data-slot="tree"
      aria-label={ariaProps['aria-label'] ?? (ariaProps['aria-labelledby'] ? undefined : labels.tree)}
      aria-labelledby={ariaProps['aria-labelledby']}
      aria-multiselectable={checkable || selectionMode === 'multiple' ? true : undefined}
      className={cn('flex flex-col text-b1 text-text-primary', className)}
    >
      {rows.map((row, index) => {
        const setRef = (element: HTMLElement | null) => {
          if (element) {
            itemRefs.current.set(row.id, element);
          } else {
            itemRefs.current.delete(row.id);
          }
        };
        const common = {
          ref: setRef,
          role: 'treeitem' as const,
          tabIndex: row.id === tabStopId ? 0 : -1,
          onFocus: () => setActiveId(row.id),
          onKeyDown: (event: KeyboardEvent<HTMLElement>) => handleKeyDown(event, index),
        };
        const rowClasses = [
          'flex min-h-11 items-center gap-field rounded-md pe-inline outline-none sm:min-h-9',
          'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        ];

        if (row.kind === 'status') {
          return (
            <div
              key={row.id}
              {...common}
              aria-level={row.depth + 1}
              aria-disabled={row.state === 'loading' ? true : undefined}
              aria-busy={row.state === 'loading' ? true : undefined}
              data-slot="tree-status"
              style={{ paddingInlineStart: `calc(${row.depth} * 1.25rem + 2.25rem)` }}
              className={cn(rowClasses, 'text-b2', row.state === 'error' ? 'cursor-pointer text-danger hover:bg-hover-row' : 'text-text-muted')}
              onClick={() => activate(row)}
            >
              {row.state === 'loading' ? <LoaderIcon className="animate-spin motion-reduce:animate-none" /> : null}
              {row.state === 'loading' ? labels.loadingChildren : labels.childrenError}
            </div>
          );
        }

        const { flat } = row;
        const { node } = flat;
        const checkState = checkStates.get(node.id) ?? 'unchecked';
        const isSelected = !checkable && selectionMode !== 'none' && selectedSet.has(node.id);
        const state: TreeNodeState = { depth: flat.depth, expanded: flat.expanded, selected: isSelected, checkState };
        return (
          <div
            key={row.id}
            {...common}
            data-slot="tree-item"
            data-id={node.id}
            aria-level={flat.depth + 1}
            aria-posinset={flat.position}
            aria-setsize={flat.setSize}
            aria-expanded={flat.isBranch ? flat.expanded : undefined}
            aria-selected={!checkable && selectionMode !== 'none' ? isSelected : undefined}
            aria-checked={checkable ? (checkState === 'indeterminate' ? 'mixed' : checkState === 'checked') : undefined}
            aria-disabled={node.disabled ? true : undefined}
            style={{ paddingInlineStart: `calc(${flat.depth} * 1.25rem + 0.5rem)` }}
            className={cn(
              rowClasses,
              'cursor-pointer select-none hover:bg-hover-row',
              isSelected && 'bg-primary-light text-primary-text hover:bg-primary-light',
              node.disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
            )}
            onClick={() => activate(row)}
          >
            <span
              aria-hidden="true"
              data-slot="tree-toggle"
              className={cn('flex size-6 shrink-0 items-center justify-center rounded-sm text-text-muted', flat.isBranch && 'hover:bg-surface-dim')}
              onClick={(event) => {
                if (flat.isBranch) {
                  event.stopPropagation();
                  setExpanded(node.id, !flat.expanded);
                }
              }}
            >
              {flat.isBranch ? flat.expanded ? <ChevronDownIcon /> : <ChevronRightIcon /> : null}
            </span>
            {checkable ? (
              <span
                aria-hidden="true"
                data-slot="tree-checkbox"
                data-state={checkState}
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-sm border border-stroke-strong bg-surface',
                  checkState !== 'unchecked' && 'border-primary bg-primary text-primary-foreground',
                )}
              >
                {checkState === 'checked' ? <CheckIcon className="size-3.5" /> : null}
                {checkState === 'indeterminate' ? <MinusIcon className="size-3.5" /> : null}
              </span>
            ) : null}
            <span className="min-w-0 flex-1 truncate">{renderNode ? renderNode(node, state) : node.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export { Tree };
export type { TreeLabels, TreeNodeState, TreeProps };

import type { KeyboardEvent, ReactNode } from 'react';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LoaderIcon,
  MinusIcon,
} from '@/components/ui/icons';
import type { TreeLoadStatus } from '@/hooks/use-tree-children';
import type { CheckState, FlatTreeNode, TreeNode } from '@/lib/tree-utils';
import { cn } from '@/lib/utils';

interface TreeNodeState {
  depth: number;
  expanded: boolean;
  selected: boolean;
  checkState: CheckState;
}

type TreeRow<TData> =
  | { kind: 'node'; id: string; flat: FlatTreeNode<TData> }
  | {
      kind: 'status';
      id: string;
      parentId: string;
      depth: number;
      state: TreeLoadStatus;
    };

/** What both kinds of row share: roving tabindex, focus tracking and keyboard handling from the tree. */
interface TreeRowBehaviour {
  setRef: (element: HTMLElement | null) => void;
  tabIndex: number;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onActivate: () => void;
}

const ROW_CLASSES = [
  'flex min-h-11 items-center gap-field rounded-md pe-inline outline-none sm:min-h-9',
  'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
];

interface TreeStatusRowProps extends TreeRowBehaviour {
  depth: number;
  state: TreeLoadStatus;
  loadingLabel: string;
  errorLabel: string;
}

/** The "Loading…" or "could not load, press Enter" row under a lazy branch. */
function TreeStatusRow({
  depth,
  state,
  loadingLabel,
  errorLabel,
  setRef,
  tabIndex,
  onFocus,
  onKeyDown,
  onActivate,
}: TreeStatusRowProps) {
  return (
    <div
      ref={setRef}
      role="treeitem"
      tabIndex={tabIndex}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      aria-level={depth + 1}
      aria-disabled={state === 'loading' ? true : undefined}
      aria-busy={state === 'loading' ? true : undefined}
      data-slot="tree-status"
      style={{
        paddingInlineStart: `calc(${depth} * 1.25rem + 2.25rem)`,
      }}
      className={cn(
        ROW_CLASSES,
        'text-b2',
        state === 'error' ? 'cursor-pointer text-danger hover:bg-hover-row' : 'text-text-muted',
      )}
      onClick={onActivate}
    >
      {state === 'loading' ? (
        <LoaderIcon className="animate-spin motion-reduce:animate-none" />
      ) : null}
      {state === 'loading' ? loadingLabel : errorLabel}
    </div>
  );
}

interface TreeItemRowProps<TData> extends TreeRowBehaviour {
  flat: FlatTreeNode<TData>;
  checkable: boolean;
  selectionMode: 'none' | 'single' | 'multiple';
  checkState: CheckState;
  selected: boolean;
  renderNode?: (node: TreeNode<TData>, state: TreeNodeState) => ReactNode;
  onToggleExpanded: (id: string, open: boolean) => void;
}

/** One node of the tree: toggle chevron, optional tri-state checkbox and the label. */
function TreeItemRow<TData>({
  flat,
  checkable,
  selectionMode,
  checkState,
  selected,
  renderNode,
  onToggleExpanded,
  setRef,
  tabIndex,
  onFocus,
  onKeyDown,
  onActivate,
}: TreeItemRowProps<TData>) {
  const { node } = flat;
  const state: TreeNodeState = {
    depth: flat.depth,
    expanded: flat.expanded,
    selected,
    checkState,
  };
  return (
    <div
      ref={setRef}
      role="treeitem"
      tabIndex={tabIndex}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      data-slot="tree-item"
      data-id={node.id}
      aria-level={flat.depth + 1}
      aria-posinset={flat.position}
      aria-setsize={flat.setSize}
      aria-expanded={flat.isBranch ? flat.expanded : undefined}
      aria-selected={!checkable && selectionMode !== 'none' ? selected : undefined}
      aria-checked={
        checkable
          ? checkState === 'indeterminate'
            ? 'mixed'
            : checkState === 'checked'
          : undefined
      }
      aria-disabled={node.disabled ? true : undefined}
      style={{
        paddingInlineStart: `calc(${flat.depth} * 1.25rem + 0.5rem)`,
      }}
      className={cn(
        ROW_CLASSES,
        'cursor-pointer select-none hover:bg-hover-row',
        selected && 'bg-primary-light text-primary-text hover:bg-primary-light',
        node.disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
      )}
      onClick={onActivate}
    >
      <span
        aria-hidden="true"
        data-slot="tree-toggle"
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-sm text-text-muted',
          flat.isBranch && 'hover:bg-surface-dim',
        )}
        onClick={(event) => {
          if (flat.isBranch) {
            event.stopPropagation();
            onToggleExpanded(node.id, !flat.expanded);
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
      <span className="min-w-0 flex-1 truncate">
        {renderNode ? renderNode(node, state) : node.label}
      </span>
    </div>
  );
}

export { TreeItemRow, TreeStatusRow };
export type { TreeItemRowProps, TreeNodeState, TreeRow, TreeStatusRowProps };

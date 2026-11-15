/** A node of a tree of any depth. `children` may be omitted for leaves and lazy branches. */
export interface TreeNode<TData = unknown> {
  id: string;
  /** Plain text: used for search, the picker's path text and the accessible name. */
  label: string;
  children?: TreeNode<TData>[];
  /** A branch whose `children` are not loaded yet (see `loadChildren` on the tree). */
  hasChildren?: boolean;
  disabled?: boolean;
  data?: TData;
}

export type CheckState = 'checked' | 'unchecked' | 'indeterminate';

/** One visible row of a flattened tree. */
export interface FlatTreeNode<TData = unknown> {
  node: TreeNode<TData>;
  /** 0 for roots. */
  depth: number;
  parentId: string | null;
  /** 1-based position among its siblings (aria-posinset). */
  position: number;
  /** Number of siblings, itself included (aria-setsize). */
  setSize: number;
  isBranch: boolean;
  expanded: boolean;
}

/** True for a node that has, or can lazily load, children. */
export function isBranch(node: TreeNode): boolean {
  return (node.children?.length ?? 0) > 0 || node.hasChildren === true;
}

/**
 * Depth-first rows of the nodes whose ancestors are all expanded. Pass
 * `expanded: 'all'` to list every node regardless of expansion.
 */
export function flattenTree<TData>(
  nodes: readonly TreeNode<TData>[],
  expanded: ReadonlySet<string> | 'all' = new Set(),
): FlatTreeNode<TData>[] {
  const rows: FlatTreeNode<TData>[] = [];
  const visit = (siblings: readonly TreeNode<TData>[], depth: number, parentId: string | null) => {
    siblings.forEach((node, index) => {
      const branch = isBranch(node);
      const open = branch && (expanded === 'all' || expanded.has(node.id));
      rows.push({
        node,
        depth,
        parentId,
        position: index + 1,
        setSize: siblings.length,
        isBranch: branch,
        expanded: open,
      });
      if (open && node.children) {
        visit(node.children, depth + 1, node.id);
      }
    });
  };
  visit(nodes, 0, null);
  return rows;
}

export function findNode<TData>(
  nodes: readonly TreeNode<TData>[],
  id: string,
): TreeNode<TData> | undefined {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const inside = node.children ? findNode(node.children, id) : undefined;
    if (inside) {
      return inside;
    }
  }
  return undefined;
}

/** The nodes from a root down to `id` (both included), or null when `id` is not in the tree. */
export function findPath<TData>(
  nodes: readonly TreeNode<TData>[],
  id: string,
): TreeNode<TData>[] | null {
  for (const node of nodes) {
    if (node.id === id) {
      return [node];
    }
    const below = node.children ? findPath(node.children, id) : null;
    if (below) {
      return [node, ...below];
    }
  }
  return null;
}

/** Ids above a node, nearest parent first. Empty for roots and unknown ids. */
export function getAncestorIds(nodes: readonly TreeNode[], id: string): string[] {
  const path = findPath(nodes, id);
  if (!path) {
    return [];
  }
  return path
    .slice(0, -1)
    .map((node) => node.id)
    .reverse();
}

/** Every node below `node`, depth first, the node itself excluded. */
export function getDescendants<TData>(node: TreeNode<TData>): TreeNode<TData>[] {
  const result: TreeNode<TData>[] = [];
  const visit = (children: readonly TreeNode<TData>[] | undefined) => {
    for (const child of children ?? []) {
      result.push(child);
      visit(child.children);
    }
  };
  visit(node.children);
  return result;
}

/**
 * Lowercases and folds Arabic spelling variants (diacritics, tatweel,
 * alef forms, ya/alef maqsura, ta marbuta) so a search finds the word however
 * it was typed.
 */
export function normalizeSearchText(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();
}

export interface FilteredTree<TData = unknown> {
  nodes: TreeNode<TData>[];
  /** Nodes whose own label matched. */
  matchIds: Set<string>;
  /** Kept only because a descendant matched: open these to reveal the matches. */
  ancestorIds: Set<string>;
}

/**
 * Keeps the nodes whose label contains `query` plus every ancestor of a match,
 * so a hit is never shown without its context. A blank query returns the tree
 * unchanged. Matched nodes keep only the descendants that match too.
 */
export function filterTree<TData>(
  nodes: readonly TreeNode<TData>[],
  query: string,
): FilteredTree<TData> {
  const needle = normalizeSearchText(query);
  const matchIds = new Set<string>();
  const ancestorIds = new Set<string>();
  if (needle === '') {
    return { nodes: [...nodes], matchIds, ancestorIds };
  }
  const prune = (siblings: readonly TreeNode<TData>[]): TreeNode<TData>[] =>
    siblings.flatMap((node) => {
      const kept = node.children ? prune(node.children) : [];
      const matches = normalizeSearchText(node.label).includes(needle);
      if (matches) {
        matchIds.add(node.id);
      }
      if (!matches && kept.length === 0) {
        return [];
      }
      if (kept.length > 0) {
        ancestorIds.add(node.id);
      }
      return [{ ...node, children: kept.length > 0 ? kept : undefined, hasChildren: undefined }];
    });
  return { nodes: prune(nodes), matchIds, ancestorIds };
}

/** Returns a copy of the tree with `childrenById[id]` attached to the node `id`. */
export function attachChildren<TData>(
  nodes: readonly TreeNode<TData>[],
  childrenById: Readonly<Record<string, readonly TreeNode<TData>[]>>,
): TreeNode<TData>[] {
  return nodes.map((node) => {
    const loaded = childrenById[node.id];
    const base = loaded ? [...loaded] : node.children;
    if (!base) {
      return node;
    }
    return { ...node, children: attachChildren(base, childrenById) };
  });
}

/* ---------------------------- tri-state checking --------------------------- */

/** Adds every descendant of a checked node (a parent in the set means "all of it"). */
function expandDown(nodes: readonly TreeNode[], checked: Set<string>, inherited: boolean): void {
  for (const node of nodes) {
    const on = inherited || checked.has(node.id);
    if (on) {
      checked.add(node.id);
    }
    if (node.children) {
      expandDown(node.children, checked, on);
    }
  }
}

/** A branch is in the set exactly when all its children are; returns whether `nodes` are all checked. */
function deriveUp(nodes: readonly TreeNode[], checked: Set<string>): boolean {
  let all = true;
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      const childrenAll = deriveUp(node.children, checked);
      if (childrenAll) {
        checked.add(node.id);
      } else {
        checked.delete(node.id);
      }
    }
    if (!checked.has(node.id)) {
      all = false;
    }
  }
  return all;
}

/**
 * Makes a set of checked ids consistent: a checked branch checks everything
 * below it, and a branch is checked only when all its children are. Branches
 * whose children are not loaded keep their own state until they load.
 */
export function normalizeChecked(
  nodes: readonly TreeNode[],
  checked: Iterable<string>,
): Set<string> {
  const next = new Set(checked);
  expandDown(nodes, next, false);
  deriveUp(nodes, next);
  return next;
}

/** Check state of every node, derived from the checked ids. */
export function getCheckStates(
  nodes: readonly TreeNode[],
  checked: Iterable<string>,
): Map<string, CheckState> {
  const set = normalizeChecked(nodes, checked);
  const states = new Map<string, CheckState>();
  const visit = (node: TreeNode): CheckState => {
    const children = node.children ?? [];
    if (children.length === 0) {
      const state: CheckState = set.has(node.id) ? 'checked' : 'unchecked';
      states.set(node.id, state);
      return state;
    }
    const childStates = children.map(visit);
    const state: CheckState = childStates.every((value) => value === 'checked')
      ? 'checked'
      : childStates.every((value) => value === 'unchecked')
        ? 'unchecked'
        : 'indeterminate';
    states.set(node.id, state);
    return state;
  };
  nodes.forEach(visit);
  return states;
}

/**
 * Toggles a node and everything below it, then re-derives its ancestors.
 * Disabled descendants keep their state. Without `next` an unchecked or
 * indeterminate node becomes checked and a fully checked one is cleared.
 */
export function toggleChecked<TData>(
  nodes: readonly TreeNode<TData>[],
  checked: Iterable<string>,
  id: string,
  next?: boolean,
): Set<string> {
  const target = findNode(nodes, id);
  const result = normalizeChecked(nodes, checked);
  if (!target || target.disabled) {
    return result;
  }
  const affected = [target, ...getDescendants(target)].filter((node) => !node.disabled);
  const leaves = affected.filter((node) => !node.children || node.children.length === 0);
  const turnOn = next ?? !leaves.every((node) => result.has(node.id));
  for (const node of affected) {
    if (turnOn) {
      result.add(node.id);
    } else {
      result.delete(node.id);
    }
  }
  deriveUp(nodes, result);
  return result;
}

/**
 * The smallest list of ids that describes the selection: a fully checked
 * branch is listed once and its descendants are left out. The inverse of what
 * `normalizeChecked` expands.
 */
export function collapseChecked(
  nodes: readonly TreeNode[],
  checked: Iterable<string>,
): string[] {
  const set = normalizeChecked(nodes, checked);
  const result: string[] = [];
  const visit = (siblings: readonly TreeNode[]) => {
    for (const node of siblings) {
      if (set.has(node.id)) {
        result.push(node.id);
      } else if (node.children) {
        visit(node.children);
      }
    }
  };
  visit(nodes);
  return result;
}

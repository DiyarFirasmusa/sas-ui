import type { ReactNode } from 'react';

/**
 * One entry of a sidebar: a link (`href`), a group (`children`), or both — a
 * group with an `href` is a link that also expands. Labels are already
 * localised by the app; permission filtering is the caller's job (see
 * `filterNavItems`).
 */
export interface NavItem {
  /** Stable key; also what `expanded` state is stored by. */
  id: string;
  label: string;
  href?: string;
  icon?: ReactNode;
  /** A count shown as a pill. 0 and undefined hide it; above 99 it reads `99+`. */
  badge?: number;
  children?: readonly NavItem[];
  /** Extra path prefixes that belong to this item, e.g. `/invoices/new` under Invoices. */
  matches?: readonly string[];
  /** Match only the exact path, for a root link such as `/`. */
  exact?: boolean;
  disabled?: boolean;
  /** Top level only: shown at the bottom of the sidebar, under a divider (settings, help). */
  pinned?: boolean;
}

/** A run of top-level links, optionally under a small heading — the HR sidebar's flat layout. */
export interface NavSection {
  id: string;
  label?: string;
  items: readonly NavItem[];
}

/** Drops the query string, hash and trailing slash so `/a/?x=1#y` equals `/a`. */
export function normalizePath(path: string): string {
  const bare = path.split(/[?#]/u)[0] ?? '';
  const trimmed = bare.length > 1 ? bare.replace(/\/+$/u, '') : bare;
  return trimmed === '' ? '/' : trimmed;
}

function prefixMatches(path: string, prefix: string): boolean {
  if (prefix === '/') {
    return path === '/';
  }
  return path === prefix || path.startsWith(`${prefix}/`);
}

/**
 * How well `item` itself (not its children) claims `path`: the length of the
 * longest matching prefix, or -1. A longer prefix is a more specific owner.
 */
export function matchLength(item: NavItem, path: string): number {
  const current = normalizePath(path);
  const candidates = [item.href, ...(item.matches ?? [])].filter(
    (value): value is string => value !== undefined,
  );
  let best = -1;
  for (const candidate of candidates) {
    const prefix = normalizePath(candidate);
    const owns =
      item.exact === true && candidate === item.href
        ? current === prefix
        : prefixMatches(current, prefix);
    if (owns) {
      best = Math.max(best, prefix.length);
    }
  }
  return best;
}

export function flattenNavItems(items: readonly NavItem[]): NavItem[] {
  return items.flatMap((item) => [item, ...flattenNavItems(item.children ?? [])]);
}

/**
 * The id of the one item that owns `path`: the deepest, most specific match,
 * so `/invoices/new` highlights its own entry rather than the `/invoices`
 * parent. On a tie the later item wins only if it is deeper. Null when none.
 */
export function findActiveId(items: readonly NavItem[], path: string): string | null {
  let bestId: string | null = null;
  let bestLength = -1;
  for (const item of flattenNavItems(items)) {
    const length = matchLength(item, path);
    if (length > bestLength) {
      bestId = item.id;
      bestLength = length;
    }
  }
  return bestId;
}

/** Ids from the top level down to `targetId` inclusive, or null when it is not in the tree. */
function pathTo(items: readonly NavItem[], targetId: string): string[] | null {
  for (const item of items) {
    if (item.id === targetId) {
      return [item.id];
    }
    const nested = pathTo(item.children ?? [], targetId);
    if (nested !== null) {
      return [item.id, ...nested];
    }
  }
  return null;
}

/** Ids of the groups that contain `targetId`, outermost first; [] when top level or absent. */
export function ancestorIds(items: readonly NavItem[], targetId: string): string[] {
  return pathTo(items, targetId)?.slice(0, -1) ?? [];
}

/** Groups to start open: every ancestor of the active item. */
export function initialExpandedIds(items: readonly NavItem[], path: string): string[] {
  const activeId = findActiveId(items, path);
  return activeId === null ? [] : ancestorIds(items, activeId);
}

/**
 * New expanded set after toggling `id`. With `single` (an accordion) opening
 * a group closes its siblings but keeps its own ancestors open.
 */
export function toggleExpanded(
  items: readonly NavItem[],
  expanded: readonly string[],
  id: string,
  { single = false }: { single?: boolean } = {},
): string[] {
  if (expanded.includes(id)) {
    return expanded.filter((entry) => entry !== id);
  }
  if (!single) {
    return [...expanded, id];
  }
  const keep = new Set(ancestorIds(items, id));
  return [...expanded.filter((entry) => keep.has(entry)), id];
}

/** A group's own badge plus those of everything under it — shown when the group is closed. */
export function totalBadge(item: NavItem): number {
  return (
    (item.badge ?? 0) + (item.children ?? []).reduce((sum, child) => sum + totalBadge(child), 0)
  );
}

/** `7`, or `99+` for anything larger, so a pill never grows with the number. */
export function formatBadge(count: number, max = 99): string {
  return count > max ? `${max}+` : String(count);
}

/**
 * Keeps the items `keep` accepts and prunes groups left with no children
 * (unless the group is a link itself). For permission checks: the caller
 * decides per item, this keeps the tree consistent.
 */
export function filterNavItems(
  items: readonly NavItem[],
  keep: (item: NavItem) => boolean,
): NavItem[] {
  return items.flatMap((item) => {
    if (!keep(item)) {
      return [];
    }
    if (!item.children) {
      return [item];
    }
    const children = filterNavItems(item.children, keep);
    if (children.length === 0 && item.href === undefined) {
      return [];
    }
    return [{ ...item, children }];
  });
}

/** Splits the top level into the main list and the entries that sit at the bottom of the sidebar. */
export function splitPinned(items: readonly NavItem[]): { main: NavItem[]; pinned: NavItem[] } {
  return {
    main: items.filter((item) => item.pinned !== true),
    pinned: items.filter((item) => item.pinned === true),
  };
}

/**
 * Flattens a tree into labelled sections: every top-level group becomes a
 * heading over its children, and consecutive top-level links share one
 * unlabelled section. Used where navigation is a flat list under small
 * headings instead of an accordion.
 */
export function toNavSections(items: readonly NavItem[]): NavSection[] {
  const sections: NavSection[] = [];
  let run: NavItem[] = [];
  const flush = () => {
    if (run.length > 0) {
      sections.push({ id: `links-${run[0]?.id ?? sections.length}`, items: run });
      run = [];
    }
  };
  for (const item of items) {
    if (item.children && item.children.length > 0) {
      flush();
      sections.push({ id: item.id, label: item.label, items: item.children });
    } else {
      run.push(item);
    }
  }
  flush();
  return sections;
}

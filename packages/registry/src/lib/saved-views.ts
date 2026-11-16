export interface ViewSorting {
  id: string;
  desc: boolean;
}

/** What a view remembers about a list: the same pieces the data table and filter bar report. */
export interface SavedViewSnapshot {
  filters: Record<string, unknown>;
  sorting: ViewSorting[];
  columnVisibility: Record<string, boolean>;
  pageSize: number;
}

export interface SavedView extends SavedViewSnapshot {
  id: string;
  name: string;
}

export interface SavedViewsState {
  views: SavedView[];
  /** The view applied when the list first opens, if any. */
  defaultViewId: string | null;
}

/** Reads and writes the views somewhere; the built-in one is `createLocalStorageAdapter`. */
export interface SavedViewsStorage {
  load: () => SavedViewsState;
  save: (state: SavedViewsState) => void;
}

export type ViewNameProblem = 'empty' | 'too-long' | 'duplicate';

export const MAX_VIEW_NAME_LENGTH = 60;
const STORAGE_VERSION = 1;

export function emptyViewsState(): SavedViewsState {
  return { views: [], defaultViewId: null };
}

/** Trims the name and collapses runs of whitespace. */
export function normalizeViewName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/** Why a name cannot be used, or `null` when it can. Names are unique ignoring case, except for the view being renamed. */
export function checkViewName(
  name: string,
  views: readonly SavedView[],
  exceptId?: string,
): ViewNameProblem | null {
  const normalized = normalizeViewName(name);
  if (normalized === '') {
    return 'empty';
  }
  if (normalized.length > MAX_VIEW_NAME_LENGTH) {
    return 'too-long';
  }
  const lower = normalized.toLocaleLowerCase();
  const taken = views.some(
    (view) => view.id !== exceptId && normalizeViewName(view.name).toLocaleLowerCase() === lower,
  );
  return taken ? 'duplicate' : null;
}

let counter = 0;

/** A new id not used by any existing view. `random` exists so tests can be deterministic. */
export function newViewId(views: readonly SavedView[], random?: () => string): string {
  const used = new Set(views.map((view) => view.id));
  counter += 1;
  const base = random ? random() : `view-${Date.now().toString(36)}-${counter.toString(36)}`;
  let id = base;
  for (let attempt = 2; used.has(id); attempt += 1) {
    id = `${base}-${attempt}`;
  }
  return id;
}

/** Builds a view from the current list state. The snapshot is copied, so later changes to the table do not leak in. */
export function createView(
  name: string,
  snapshot: SavedViewSnapshot,
  views: readonly SavedView[],
  random?: () => string,
): SavedView {
  return {
    id: newViewId(views, random),
    name: normalizeViewName(name),
    filters: cloneFilters(snapshot.filters),
    sorting: snapshot.sorting.map((sort) => ({ id: sort.id, desc: sort.desc })),
    columnVisibility: { ...snapshot.columnVisibility },
    pageSize: snapshot.pageSize,
  };
}

function cloneFilters(value: Record<string, unknown>): Record<string, unknown> {
  const copy: unknown = JSON.parse(JSON.stringify(value));
  return isRecord(copy) ? copy : {};
}

export function addView(state: SavedViewsState, view: SavedView): SavedViewsState {
  return { ...state, views: [...state.views, view] };
}

export function renameView(state: SavedViewsState, id: string, name: string): SavedViewsState {
  return {
    ...state,
    views: state.views.map((view) =>
      view.id === id ? { ...view, name: normalizeViewName(name) } : view,
    ),
  };
}

/** Removes a view; if it was the default there is no default any more. */
export function deleteView(state: SavedViewsState, id: string): SavedViewsState {
  return {
    views: state.views.filter((view) => view.id !== id),
    defaultViewId: state.defaultViewId === id ? null : state.defaultViewId,
  };
}

/** Marks a view as the default, or clears it with `null`. An unknown id leaves the state unchanged. */
export function setDefaultView(state: SavedViewsState, id: string | null): SavedViewsState {
  if (id !== null && !state.views.some((view) => view.id === id)) {
    return state;
  }
  return { ...state, defaultViewId: id };
}

export function findView(
  state: SavedViewsState,
  id: string | null | undefined,
): SavedView | undefined {
  return id ? state.views.find((view) => view.id === id) : undefined;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys(value[key])]),
    );
  }
  return value;
}

/** Whether two snapshots describe the same list, regardless of key order. Used to tell if a view was changed. */
export function snapshotsEqual(a: SavedViewSnapshot, b: SavedViewSnapshot): boolean {
  const pick = (snapshot: SavedViewSnapshot) =>
    JSON.stringify(
      sortKeys({
        filters: snapshot.filters,
        sorting: snapshot.sorting,
        columnVisibility: snapshot.columnVisibility,
        pageSize: snapshot.pageSize,
      }),
    );
  return pick(a) === pick(b);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSorting(value: unknown): value is ViewSorting {
  return isRecord(value) && typeof value.id === 'string' && typeof value.desc === 'boolean';
}

function toView(value: unknown): SavedView | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    !isRecord(value.filters) ||
    !Array.isArray(value.sorting) ||
    !value.sorting.every(isSorting) ||
    !isRecord(value.columnVisibility) ||
    typeof value.pageSize !== 'number' ||
    !Number.isFinite(value.pageSize)
  ) {
    return null;
  }
  const columnVisibility: Record<string, boolean> = {};
  for (const [key, visible] of Object.entries(value.columnVisibility)) {
    if (typeof visible === 'boolean') {
      columnVisibility[key] = visible;
    }
  }
  return {
    id: value.id,
    name: value.name,
    filters: value.filters,
    sorting: value.sorting.map((sort) => ({ id: sort.id, desc: sort.desc })),
    columnVisibility,
    pageSize: value.pageSize,
  };
}

/** Reads stored data defensively: anything malformed is dropped rather than thrown on. */
export function parseSavedViews(raw: unknown): SavedViewsState {
  if (!isRecord(raw) || !Array.isArray(raw.views)) {
    return emptyViewsState();
  }
  const seen = new Set<string>();
  const views: SavedView[] = [];
  for (const entry of raw.views) {
    const view = toView(entry);
    if (view && !seen.has(view.id)) {
      seen.add(view.id);
      views.push(view);
    }
  }
  const defaultViewId =
    typeof raw.defaultViewId === 'string' && seen.has(raw.defaultViewId) ? raw.defaultViewId : null;
  return { views, defaultViewId };
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function browserStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    // Reading `localStorage` itself throws when site data is blocked.
    return null;
  }
}

/**
 * Keeps the views in `localStorage` under `key`. Every access is guarded:
 * private windows, blocked site data, a full quota, server rendering and
 * corrupted JSON all end in an empty list or a skipped write, never an error.
 */
export function createLocalStorageAdapter(key: string, storage?: StorageLike): SavedViewsStorage {
  return {
    load() {
      try {
        const store = storage ?? browserStorage();
        const text = store?.getItem(key);
        return text ? parseSavedViews(JSON.parse(text)) : emptyViewsState();
      } catch {
        return emptyViewsState();
      }
    },
    save(state) {
      try {
        const store = storage ?? browserStorage();
        store?.setItem(key, JSON.stringify({ version: STORAGE_VERSION, ...state }));
      } catch {
        // Quota or blocked storage: the views stay in memory for this visit.
      }
    },
  };
}

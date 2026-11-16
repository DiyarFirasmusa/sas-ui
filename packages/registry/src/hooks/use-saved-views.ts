import { useMemo, useState } from 'react';
import {
  addView,
  createLocalStorageAdapter,
  deleteView,
  emptyViewsState,
  renameView,
  setDefaultView,
  type SavedView,
  type SavedViewsState,
  type SavedViewsStorage,
} from '@/lib/saved-views';

interface UseSavedViewsOptions {
  /** Controlled views: the hook only reports changes and the parent owns the list. */
  views?: SavedView[];
  /** Controlled default, read together with `views`. */
  defaultViewId?: string | null;
  /** Keeps views in `localStorage` under this key when `views` is not controlled. */
  storageKey?: string;
  /** Your own storage (a server, IndexedDB…). Used instead of `storageKey`. */
  storage?: SavedViewsStorage;
}

/**
 * The saved views list with its changes. Controlled when `views` is given;
 * otherwise kept here and written to the storage adapter after every change.
 */
function useSavedViews({ views, defaultViewId, storageKey, storage }: UseSavedViewsOptions) {
  const adapter = useMemo(
    () => storage ?? (storageKey ? createLocalStorageAdapter(storageKey) : undefined),
    [storage, storageKey],
  );
  const [inner, setInner] = useState<SavedViewsState>(() => adapter?.load() ?? emptyViewsState());
  const controlled = views !== undefined;
  const state: SavedViewsState = controlled
    ? { views, defaultViewId: defaultViewId ?? null }
    : inner;

  function commit(next: SavedViewsState) {
    if (!controlled) {
      setInner(next);
      adapter?.save(next);
    }
  }

  return {
    state,
    add: (view: SavedView) => commit(addView(state, view)),
    rename: (id: string, name: string) => commit(renameView(state, id, name)),
    remove: (id: string) => commit(deleteView(state, id)),
    setDefault: (id: string | null) => commit(setDefaultView(state, id)),
  };
}

export { useSavedViews };
export type { UseSavedViewsOptions };

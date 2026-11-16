import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useSavedViews } from '@/hooks/use-saved-views';
import {
  createLocalStorageAdapter,
  emptyViewsState,
  type SavedView,
  type SavedViewsState,
  type SavedViewsStorage,
} from '@/lib/saved-views';

function view(id: string, name: string): SavedView {
  return {
    id,
    name,
    filters: {},
    sorting: [],
    columnVisibility: {},
    pageSize: 10,
  };
}

afterEach(() => window.localStorage.clear());

describe('useSavedViews uncontrolled', () => {
  it('starts empty and changes the list', () => {
    const { result } = renderHook(() => useSavedViews({}));
    expect(result.current.state).toEqual(emptyViewsState());
    act(() => result.current.add(view('a', 'الحجوزات')));
    act(() => result.current.add(view('b', 'B')));
    act(() => result.current.setDefault('b'));
    expect(result.current.state.defaultViewId).toBe('b');
    act(() => result.current.rename('a', 'Renamed'));
    expect(result.current.state.views.map((entry) => entry.name)).toEqual(['Renamed', 'B']);
    act(() => result.current.remove('b'));
    expect(result.current.state).toMatchObject({ views: [{ id: 'a' }], defaultViewId: null });
  });

  it('persists to localStorage under the storage key and loads it back', () => {
    const first = renderHook(() => useSavedViews({ storageKey: 'bookings' }));
    act(() => first.result.current.add(view('a', 'Mine')));
    expect(createLocalStorageAdapter('bookings').load().views).toHaveLength(1);
    first.unmount();
    const second = renderHook(() => useSavedViews({ storageKey: 'bookings' }));
    expect(second.result.current.state.views.map((entry) => entry.id)).toEqual(['a']);
  });

  it('uses a custom storage adapter instead of the key', () => {
    const saved: SavedViewsState[] = [];
    const storage: SavedViewsStorage = {
      load: () => ({ views: [view('x', 'From server')], defaultViewId: 'x' }),
      save: (state) => void saved.push(state),
    };
    const { result } = renderHook(() => useSavedViews({ storage, storageKey: 'ignored' }));
    expect(result.current.state.defaultViewId).toBe('x');
    act(() => result.current.remove('x'));
    expect(saved).toEqual([{ views: [], defaultViewId: null }]);
    expect(window.localStorage.getItem('ignored')).toBeNull();
  });
});

describe('useSavedViews controlled', () => {
  it('reads the given views and default and leaves changes to the parent', () => {
    const storage: SavedViewsStorage = {
      load: () => emptyViewsState(),
      save: () => {
        throw new Error('must not write while controlled');
      },
    };
    const views = [view('a', 'A')];
    const { result } = renderHook(() => useSavedViews({ views, defaultViewId: 'a', storage }));
    expect(result.current.state).toEqual({ views, defaultViewId: 'a' });
    act(() => result.current.add(view('b', 'B')));
    expect(result.current.state.views).toHaveLength(1);
  });

  it('treats a missing default as none', () => {
    const { result } = renderHook(() => useSavedViews({ views: [view('a', 'A')] }));
    expect(result.current.state.defaultViewId).toBeNull();
  });
});

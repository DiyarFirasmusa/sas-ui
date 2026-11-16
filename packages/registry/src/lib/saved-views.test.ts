import { describe, expect, it, vi } from 'vitest';
import {
  MAX_VIEW_NAME_LENGTH,
  addView,
  checkViewName,
  createLocalStorageAdapter,
  createView,
  deleteView,
  emptyViewsState,
  findView,
  newViewId,
  normalizeViewName,
  parseSavedViews,
  renameView,
  setDefaultView,
  snapshotsEqual,
  type SavedView,
  type SavedViewSnapshot,
} from '@/lib/saved-views';

const snapshot: SavedViewSnapshot = {
  filters: { status: 'open', q: 'مكتب', range: { from: '2025-01-01' } },
  sorting: [{ id: 'total', desc: true }],
  columnVisibility: { city: false },
  pageSize: 25,
};

function view(id: string, name: string): SavedView {
  return { id, name, ...snapshot };
}

describe('view names', () => {
  it('normalises whitespace', () => {
    expect(normalizeViewName('  My   open\tbookings ')).toBe('My open bookings');
  });

  it('rejects empty, too long and duplicate names', () => {
    const views = [view('a', 'Open bookings')];
    expect(checkViewName('   ', views)).toBe('empty');
    expect(checkViewName('x'.repeat(MAX_VIEW_NAME_LENGTH + 1), views)).toBe('too-long');
    expect(checkViewName('x'.repeat(MAX_VIEW_NAME_LENGTH), views)).toBeNull();
    expect(checkViewName('open   BOOKINGS', views)).toBe('duplicate');
    expect(checkViewName('Closed', views)).toBeNull();
  });

  it('lets a view keep its own name when it is renamed', () => {
    const views = [view('a', 'Open'), view('b', 'Closed')];
    expect(checkViewName('open', views, 'a')).toBeNull();
    expect(checkViewName('open', views, 'b')).toBe('duplicate');
  });

  it('accepts Arabic names', () => {
    expect(checkViewName('الحجوزات المفتوحة', [view('a', 'الحجوزات المغلقة')])).toBeNull();
    expect(checkViewName('الحجوزات المفتوحة', [view('a', 'الحجوزات المفتوحة')])).toBe('duplicate');
  });
});

describe('ids and creation', () => {
  it('never reuses an existing id, even from a stuck generator', () => {
    const existing = [view('fixed', 'A')];
    expect(newViewId(existing, () => 'fixed')).toBe('fixed-2');
    expect(newViewId([view('fixed', 'A'), view('fixed-2', 'B')], () => 'fixed')).toBe('fixed-3');
  });

  it('generates distinct ids by default', () => {
    expect(newViewId([])).not.toBe(newViewId([]));
  });

  it('copies the snapshot so the view is not tied to live state', () => {
    const live: SavedViewSnapshot = {
      filters: { tags: ['a'] },
      sorting: [{ id: 'x', desc: false }],
      columnVisibility: { a: true },
      pageSize: 10,
    };
    const created = createView('  Mine ', live, [], () => 'id-1');
    live.filters.tags = ['changed'];
    live.sorting[0] = { id: 'y', desc: true };
    live.columnVisibility.a = false;
    expect(created).toEqual({
      id: 'id-1',
      name: 'Mine',
      filters: { tags: ['a'] },
      sorting: [{ id: 'x', desc: false }],
      columnVisibility: { a: true },
      pageSize: 10,
    });
  });
});

describe('state changes', () => {
  const start = { views: [view('a', 'A'), view('b', 'B')], defaultViewId: 'a' };

  it('adds, renames and finds', () => {
    const added = addView(start, view('c', 'C'));
    expect(added.views.map((entry) => entry.id)).toEqual(['a', 'b', 'c']);
    expect(start.views).toHaveLength(2);
    expect(renameView(added, 'b', '  Renamed  ').views[1]?.name).toBe('Renamed');
    expect(findView(added, 'c')?.name).toBe('C');
    expect(findView(added, 'zzz')).toBeUndefined();
    expect(findView(added, null)).toBeUndefined();
  });

  it('deleting the default view clears the default', () => {
    expect(deleteView(start, 'a')).toEqual({ views: [view('b', 'B')], defaultViewId: null });
    expect(deleteView(start, 'b').defaultViewId).toBe('a');
  });

  it('sets and clears the default, ignoring unknown ids', () => {
    expect(setDefaultView(start, 'b').defaultViewId).toBe('b');
    expect(setDefaultView(start, null).defaultViewId).toBeNull();
    expect(setDefaultView(start, 'nope')).toBe(start);
  });
});

describe('snapshotsEqual', () => {
  it('ignores key order and compares values', () => {
    expect(
      snapshotsEqual(snapshot, {
        ...snapshot,
        filters: { range: { from: '2025-01-01' }, q: 'مكتب', status: 'open' },
      }),
    ).toBe(true);
    expect(snapshotsEqual(snapshot, { ...snapshot, pageSize: 50 })).toBe(false);
    expect(snapshotsEqual(snapshot, { ...snapshot, sorting: [] })).toBe(false);
    expect(snapshotsEqual(snapshot, { ...snapshot, columnVisibility: {} })).toBe(false);
    expect(snapshotsEqual(snapshot, { ...snapshot, filters: { status: 'done' } })).toBe(false);
  });
});

describe('parseSavedViews', () => {
  it('reads a valid state', () => {
    const state = { views: [view('a', 'A')], defaultViewId: 'a' };
    expect(parseSavedViews(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });

  it('drops malformed and duplicate entries and an unknown default', () => {
    const parsed = parseSavedViews({
      views: [
        view('a', 'A'),
        view('a', 'Again'),
        { id: 'x' },
        null,
        { ...view('b', 'B'), sorting: [{ id: 1 }] },
        { ...view('c', 'C'), pageSize: 'ten' },
        { ...view('d', 'D'), columnVisibility: { ok: true, bad: 'no' } },
      ],
      defaultViewId: 'ghost',
    });
    expect(parsed.views.map((entry) => entry.id)).toEqual(['a', 'd']);
    expect(parsed.views[1]?.columnVisibility).toEqual({ ok: true });
    expect(parsed.defaultViewId).toBeNull();
  });

  it('returns an empty state for anything that is not a state', () => {
    for (const raw of [null, undefined, 'x', 3, [], {}, { views: 'no' }]) {
      expect(parseSavedViews(raw)).toEqual(emptyViewsState());
    }
  });
});

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    data,
  };
}

describe('createLocalStorageAdapter', () => {
  it('round-trips through the storage under its key, Arabic included', () => {
    const storage = memoryStorage();
    const adapter = createLocalStorageAdapter('views:bookings', storage);
    expect(adapter.load()).toEqual(emptyViewsState());
    const state = { views: [view('a', 'الحجوزات المفتوحة')], defaultViewId: 'a' };
    adapter.save(state);
    expect(JSON.parse(storage.data.get('views:bookings') ?? '{}')).toMatchObject({ version: 1 });
    expect(adapter.load()).toEqual(state);
    expect(createLocalStorageAdapter('other', storage).load()).toEqual(emptyViewsState());
  });

  it('survives corrupted JSON', () => {
    const adapter = createLocalStorageAdapter('k', memoryStorage({ k: '{not json' }));
    expect(adapter.load()).toEqual(emptyViewsState());
  });

  it('survives a storage that throws on read and write', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };
    const adapter = createLocalStorageAdapter('k', broken);
    expect(adapter.load()).toEqual(emptyViewsState());
    expect(() => adapter.save(emptyViewsState())).not.toThrow();
  });

  it('uses window.localStorage by default and survives it being blocked', () => {
    const adapter = createLocalStorageAdapter('default-key');
    adapter.save({ views: [view('a', 'A')], defaultViewId: null });
    expect(adapter.load().views).toHaveLength(1);
    window.localStorage.removeItem('default-key');

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(adapter.load()).toEqual(emptyViewsState());
  });

  it('does nothing without localStorage (server rendering)', () => {
    vi.stubGlobal('localStorage', undefined);
    try {
      const adapter = createLocalStorageAdapter('k');
      expect(adapter.load()).toEqual(emptyViewsState());
      expect(() => adapter.save(emptyViewsState())).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

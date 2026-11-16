import { describe, expect, it } from 'vitest';
import {
  buildDisplayItems,
  flattenGroups,
  groupKeyOf,
  groupRows,
  toggleCollapsed,
} from '@/lib/data-table-grouping';

interface Item {
  id: number;
  status: string | null | undefined;
}

const items: Item[] = [
  { id: 1, status: 'open' },
  { id: 2, status: 'done' },
  { id: 3, status: 'open' },
  { id: 4, status: null },
  { id: 5, status: 'done' },
  { id: 6, status: undefined },
];

const byStatus = (item: Item) => item.status;

describe('groupKeyOf', () => {
  it('maps empty values to the empty key and everything else to a string', () => {
    expect(groupKeyOf(null)).toBe('');
    expect(groupKeyOf(undefined)).toBe('');
    expect(groupKeyOf('open')).toBe('open');
    expect(groupKeyOf(12)).toBe('12');
    expect(groupKeyOf(false)).toBe('false');
    expect(groupKeyOf(new Date('2025-03-01T00:00:00Z'))).toBe('2025-03-01T00:00:00.000Z');
    expect(groupKeyOf(new Date('nope'))).toBe('');
    expect(groupKeyOf({ a: 1 })).toBe('{"a":1}');
  });

  it('keeps Arabic values as they are', () => {
    expect(groupKeyOf('مؤكد')).toBe('مؤكد');
  });
});

describe('groupRows', () => {
  it('groups in first-seen order and keeps row order inside groups', () => {
    const groups = groupRows(items, byStatus);
    expect(groups.map((group) => group.key)).toEqual(['open', 'done', '']);
    expect(groups.map((group) => group.rows.map((row) => row.id))).toEqual([
      [1, 3],
      [2, 5],
      [4, 6],
    ]);
  });

  it('keeps the original value, not the key', () => {
    const date = new Date('2025-03-01T00:00:00Z');
    const [group] = groupRows([{ when: date }], (row) => row.when);
    expect(group?.value).toBe(date);
  });

  it('returns no groups for no rows', () => {
    expect(groupRows([], byStatus)).toEqual([]);
  });
});

describe('flattenGroups', () => {
  it('puts each header before its rows', () => {
    const flat = flattenGroups(groupRows(items, byStatus), new Set());
    expect(
      flat.map((item) => (item.kind === 'group' ? `g:${item.key}` : `r:${item.row.id}`)),
    ).toEqual(['g:open', 'r:1', 'r:3', 'g:done', 'r:2', 'r:5', 'g:', 'r:4', 'r:6']);
  });

  it('reports the full count and the expanded state on a collapsed group', () => {
    const flat = flattenGroups(groupRows(items, byStatus), new Set(['open']));
    expect(flat[0]).toMatchObject({ kind: 'group', key: 'open', count: 2, expanded: false });
    expect(flat[1]).toMatchObject({ kind: 'group', key: 'done', count: 2, expanded: true });
    expect(flat.filter((item) => item.kind === 'row')).toHaveLength(4);
  });

  it('marks rows with their group', () => {
    const flat = flattenGroups(groupRows(items, byStatus), new Set());
    expect(flat[1]).toMatchObject({ kind: 'row', groupKey: 'open' });
  });
});

describe('buildDisplayItems', () => {
  it('lists plain rows when there is nothing to group by', () => {
    const flat = buildDisplayItems(items, undefined, new Set(['open']));
    expect(flat).toHaveLength(items.length);
    expect(flat.every((item) => item.kind === 'row')).toBe(true);
  });

  it('groups when given a value reader', () => {
    expect(
      buildDisplayItems(items, byStatus, new Set()).filter((item) => item.kind === 'group'),
    ).toHaveLength(3);
  });
});

describe('toggleCollapsed', () => {
  it('flips a key without changing the given set', () => {
    const start = new Set(['a']);
    const added = toggleCollapsed(start, 'b');
    expect([...added].sort()).toEqual(['a', 'b']);
    expect([...start]).toEqual(['a']);
    expect([...toggleCollapsed(added, 'a')]).toEqual(['b']);
  });
});

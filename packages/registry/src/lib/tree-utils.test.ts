import { describe, expect, it } from 'vitest';
import {
  attachChildren,
  collapseChecked,
  filterTree,
  findNode,
  findPath,
  flattenTree,
  getAncestorIds,
  getCheckStates,
  getDescendants,
  isBranch,
  normalizeChecked,
  normalizeSearchText,
  toggleChecked,
  type TreeNode,
} from '@/lib/tree-utils';

const tree: TreeNode[] = [
  {
    id: 'hq',
    label: 'Headquarters',
    children: [
      {
        id: 'fin',
        label: 'Finance',
        children: [
          { id: 'ap', label: 'Payables' },
          { id: 'ar', label: 'Receivables' },
        ],
      },
      { id: 'hr', label: 'Human resources' },
    ],
  },
  {
    id: 'br',
    label: 'Branch',
    children: [{ id: 'br-1', label: 'Branch office' }],
  },
  { id: 'solo', label: 'Solo' },
];

function ids(nodes: readonly TreeNode[]): string[] {
  return nodes.flatMap((node) => [node.id, ...ids(node.children ?? [])]);
}

describe('isBranch', () => {
  it('is true for nodes with children or a lazy flag', () => {
    expect(isBranch({ id: 'a', label: 'A', children: [{ id: 'b', label: 'B' }] })).toBe(true);
    expect(isBranch({ id: 'a', label: 'A', hasChildren: true })).toBe(true);
  });

  it('is false for leaves and empty child lists', () => {
    expect(isBranch({ id: 'a', label: 'A' })).toBe(false);
    expect(isBranch({ id: 'a', label: 'A', children: [] })).toBe(false);
  });
});

describe('flattenTree', () => {
  it('lists only roots when nothing is expanded', () => {
    expect(flattenTree(tree).map((row) => row.node.id)).toEqual(['hq', 'br', 'solo']);
  });

  it('descends into expanded nodes only', () => {
    const rows = flattenTree(tree, new Set(['hq']));
    expect(rows.map((row) => row.node.id)).toEqual(['hq', 'fin', 'hr', 'br', 'solo']);
    const finance = rows.find((row) => row.node.id === 'fin');
    expect(finance).toMatchObject({
      depth: 1,
      parentId: 'hq',
      position: 1,
      setSize: 2,
      isBranch: true,
      expanded: false,
    });
  });

  it('lists every node with "all", at any depth', () => {
    expect(flattenTree(tree, 'all').map((row) => row.node.id)).toEqual(ids(tree));
    const deep: TreeNode = { id: '0', label: '0' };
    let cursor = deep;
    for (let level = 1; level <= 200; level += 1) {
      const child: TreeNode = { id: String(level), label: String(level) };
      cursor.children = [child];
      cursor = child;
    }
    const rows = flattenTree([deep], 'all');
    expect(rows).toHaveLength(201);
    expect(rows.at(-1)?.depth).toBe(200);
  });

  it('ignores expansion of leaves and does not descend into lazy nodes without children', () => {
    const rows = flattenTree(
      [
        { id: 'lazy', label: 'Lazy', hasChildren: true },
        { id: 'leaf', label: 'Leaf' },
      ],
      new Set(['lazy', 'leaf']),
    );
    expect(rows.map((row) => [row.node.id, row.expanded])).toEqual([
      ['lazy', true],
      ['leaf', false],
    ]);
  });

  it('returns nothing for an empty tree', () => {
    expect(flattenTree([])).toEqual([]);
  });
});

describe('findNode / findPath / getAncestorIds', () => {
  it('finds nodes at any depth', () => {
    expect(findNode(tree, 'ar')?.label).toBe('Receivables');
    expect(findNode(tree, 'nope')).toBeUndefined();
  });

  it('returns the path from the root', () => {
    expect(findPath(tree, 'ap')?.map((node) => node.id)).toEqual(['hq', 'fin', 'ap']);
    expect(findPath(tree, 'hq')?.map((node) => node.id)).toEqual(['hq']);
    expect(findPath(tree, 'nope')).toBeNull();
  });

  it('lists ancestors nearest first', () => {
    expect(getAncestorIds(tree, 'ap')).toEqual(['fin', 'hq']);
    expect(getAncestorIds(tree, 'hq')).toEqual([]);
    expect(getAncestorIds(tree, 'nope')).toEqual([]);
  });
});

describe('getDescendants', () => {
  it('lists everything below a node, depth first, without the node', () => {
    expect(getDescendants(tree[0]!).map((node) => node.id)).toEqual(['fin', 'ap', 'ar', 'hr']);
    expect(getDescendants(tree[2]!)).toEqual([]);
  });
});

describe('normalizeSearchText', () => {
  it('lowercases and trims', () => {
    expect(normalizeSearchText('  FinANCE ')).toBe('finance');
  });

  it('folds Arabic spelling variants', () => {
    expect(normalizeSearchText('أحمد')).toBe(normalizeSearchText('احمد'));
    expect(normalizeSearchText('مدرسة')).toBe(normalizeSearchText('مدرسه'));
    expect(normalizeSearchText('مَدْرَسَة')).toBe(normalizeSearchText('مدرسة'));
    expect(normalizeSearchText('على')).toBe(normalizeSearchText('علي'));
    expect(normalizeSearchText('كــتاب')).toBe('كتاب');
  });
});

describe('filterTree', () => {
  it('returns the tree unchanged for a blank query', () => {
    const result = filterTree(tree, '   ');
    expect(result.nodes).toEqual(tree);
    expect(result.matchIds.size).toBe(0);
  });

  it('keeps matches with all their ancestors and drops the rest', () => {
    const result = filterTree(tree, 'payab');
    expect(ids(result.nodes)).toEqual(['hq', 'fin', 'ap']);
    expect([...result.matchIds]).toEqual(['ap']);
    expect([...result.ancestorIds].sort()).toEqual(['fin', 'hq']);
  });

  it('is case insensitive and matches ancestors that match themselves', () => {
    const result = filterTree(tree, 'BRANCH');
    expect(ids(result.nodes)).toEqual(['br', 'br-1']);
    expect([...result.matchIds].sort()).toEqual(['br', 'br-1']);
    expect([...result.ancestorIds]).toEqual(['br']);
  });

  it('returns an empty tree when nothing matches', () => {
    expect(filterTree(tree, 'zzz').nodes).toEqual([]);
  });

  it('does not change the input', () => {
    const before = JSON.stringify(tree);
    filterTree(tree, 'fin');
    expect(JSON.stringify(tree)).toBe(before);
  });

  it('matches Arabic regardless of spelling variant', () => {
    const arabic: TreeNode[] = [
      {
        id: 'a',
        label: 'الإدارة العامة',
        children: [{ id: 'b', label: 'قسم المالية' }],
      },
    ];
    expect(ids(filterTree(arabic, 'الاداره').nodes)).toEqual(['a']);
    expect(ids(filterTree(arabic, 'ماليه').nodes)).toEqual(['a', 'b']);
  });

  it('clears the lazy flag on pruned branches', () => {
    const lazy: TreeNode[] = [{ id: 'x', label: 'Alpha', hasChildren: true }];
    expect(filterTree(lazy, 'alp').nodes[0]?.hasChildren).toBeUndefined();
  });
});

describe('attachChildren', () => {
  it('attaches loaded children at any level without mutating the input', () => {
    const lazy: TreeNode[] = [
      { id: 'a', label: 'A', hasChildren: true },
      {
        id: 'b',
        label: 'B',
        children: [{ id: 'c', label: 'C', hasChildren: true }],
      },
    ];
    const result = attachChildren(lazy, {
      a: [{ id: 'a1', label: 'A1' }],
      c: [{ id: 'c1', label: 'C1' }],
    });
    expect(ids(result)).toEqual(['a', 'a1', 'b', 'c', 'c1']);
    expect(lazy[0]?.children).toBeUndefined();
  });

  it('returns nodes untouched when nothing is loaded', () => {
    expect(attachChildren(tree, {})).toEqual(tree);
  });
});

describe('normalizeChecked', () => {
  it('checks everything below a checked branch', () => {
    expect([...normalizeChecked(tree, ['fin'])].sort()).toEqual(['ap', 'ar', 'fin']);
  });

  it('checks a branch when all of its children are checked', () => {
    expect([...normalizeChecked(tree, ['ap', 'ar'])].sort()).toEqual(['ap', 'ar', 'fin']);
    expect([...normalizeChecked(tree, ['ap', 'ar', 'hr'])].sort()).toEqual([
      'ap',
      'ar',
      'fin',
      'hq',
      'hr',
    ]);
  });

  it('drops a checked branch whose children are not all checked', () => {
    const set = normalizeChecked(tree, ['ap']);
    expect(set.has('fin')).toBe(false);
    expect(set.has('ap')).toBe(true);
  });

  it('keeps ids that are not in the tree', () => {
    expect(normalizeChecked(tree, ['ghost']).has('ghost')).toBe(true);
  });

  it('keeps the own state of branches that have not loaded', () => {
    const lazy: TreeNode[] = [{ id: 'a', label: 'A', hasChildren: true }];
    expect(normalizeChecked(lazy, ['a']).has('a')).toBe(true);
  });
});

describe('getCheckStates', () => {
  it('derives checked, unchecked and indeterminate', () => {
    const states = getCheckStates(tree, ['ap']);
    expect(states.get('ap')).toBe('checked');
    expect(states.get('ar')).toBe('unchecked');
    expect(states.get('fin')).toBe('indeterminate');
    expect(states.get('hq')).toBe('indeterminate');
    expect(states.get('br')).toBe('unchecked');
    expect(states.get('solo')).toBe('unchecked');
  });

  it('marks a branch checked when its children are', () => {
    const states = getCheckStates(tree, ['ap', 'ar']);
    expect(states.get('fin')).toBe('checked');
    expect(states.get('hq')).toBe('indeterminate');
  });

  it('treats a checked parent id as everything below it', () => {
    const states = getCheckStates(tree, ['hq']);
    expect(states.get('hq')).toBe('checked');
    expect(states.get('ap')).toBe('checked');
    expect(states.get('hr')).toBe('checked');
    expect(states.get('br')).toBe('unchecked');
  });

  it('covers every node', () => {
    expect(getCheckStates(tree, []).size).toBe(ids(tree).length);
  });
});

describe('toggleChecked', () => {
  it('checks a leaf and updates the ancestors', () => {
    const result = toggleChecked(tree, [], 'ap');
    expect([...result]).toEqual(['ap']);
    const full = toggleChecked(tree, result, 'ar');
    expect(full.has('fin')).toBe(true);
    expect(full.has('hq')).toBe(false);
  });

  it('checks a whole branch', () => {
    expect([...toggleChecked(tree, [], 'hq')].sort()).toEqual(['ap', 'ar', 'fin', 'hq', 'hr']);
  });

  it('unchecks a branch and every descendant', () => {
    const all = toggleChecked(tree, [], 'hq');
    expect([...toggleChecked(tree, all, 'hq')]).toEqual([]);
  });

  it('turns an indeterminate branch fully on', () => {
    const result = toggleChecked(tree, ['ap'], 'fin');
    expect([...result].sort()).toEqual(['ap', 'ar', 'fin']);
  });

  it('unchecking one child clears the parent but keeps its siblings', () => {
    const result = toggleChecked(tree, ['hq'], 'ap');
    expect([...result].sort()).toEqual(['ar', 'hr']);
  });

  it('honours an explicit next value', () => {
    expect([...toggleChecked(tree, ['ap'], 'ap', true)]).toEqual(['ap']);
    expect([...toggleChecked(tree, [], 'ap', false)]).toEqual([]);
  });

  it('leaves disabled descendants as they are', () => {
    const guarded: TreeNode[] = [
      {
        id: 'p',
        label: 'P',
        children: [
          { id: 'x', label: 'X' },
          { id: 'y', label: 'Y', disabled: true },
        ],
      },
    ];
    const first = toggleChecked(guarded, [], 'p');
    expect([...first]).toEqual(['x']);
    expect(getCheckStates(guarded, first).get('p')).toBe('indeterminate');
    // Everything that can be checked is checked, so the next click clears it.
    expect([...toggleChecked(guarded, first, 'p')]).toEqual([]);
  });

  it('does nothing for a disabled or unknown node', () => {
    const guarded: TreeNode[] = [{ id: 'd', label: 'D', disabled: true }];
    expect([...toggleChecked(guarded, [], 'd')]).toEqual([]);
    expect([...toggleChecked(guarded, ['q'], 'nope')]).toEqual(['q']);
  });

  it('does not change the input set', () => {
    const input = new Set(['ap']);
    toggleChecked(tree, input, 'ar');
    expect([...input]).toEqual(['ap']);
  });
});

describe('collapseChecked', () => {
  it('lists a fully checked branch once', () => {
    expect(collapseChecked(tree, ['ap', 'ar', 'hr'])).toEqual(['hq']);
  });

  it('lists the highest checked nodes of a partial selection', () => {
    expect(collapseChecked(tree, ['ap', 'ar', 'br-1'])).toEqual(['fin', 'br']);
    expect(collapseChecked(tree, ['ap', 'solo'])).toEqual(['ap', 'solo']);
  });

  it('returns nothing for an empty selection', () => {
    expect(collapseChecked(tree, [])).toEqual([]);
  });

  it('round-trips with normalizeChecked', () => {
    const collapsed = collapseChecked(tree, ['hq', 'solo']);
    expect(collapsed).toEqual(['hq', 'solo']);
    expect([...normalizeChecked(tree, collapsed)].sort()).toEqual([
      'ap',
      'ar',
      'fin',
      'hq',
      'hr',
      'solo',
    ]);
  });
});

describe('attachChildren lazy flag', () => {
  it('turns a loaded empty branch into a leaf', () => {
    const [node] = attachChildren([{ id: 'a', label: 'A', hasChildren: true }], { a: [] });
    expect(isBranch(node!)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import {
  ancestorIds,
  filterNavItems,
  findActiveId,
  flattenNavItems,
  formatBadge,
  initialExpandedIds,
  matchLength,
  normalizePath,
  toggleExpanded,
  totalBadge,
  type NavItem,
} from '@/lib/nav-utils';

const items: NavItem[] = [
  { id: 'home', label: 'Home', href: '/', exact: true },
  {
    id: 'sales',
    label: 'Sales',
    badge: 1,
    children: [
      {
        id: 'orders',
        label: 'Orders',
        href: '/sales/orders',
        badge: 3,
        matches: ['/checkout'],
      },
      { id: 'new-order', label: 'New order', href: '/sales/orders/new' },
      {
        id: 'reports',
        label: 'Reports',
        children: [{ id: 'monthly', label: 'Monthly', href: '/sales/reports/monthly' }],
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    children: [{ id: 'profile', label: 'Profile', href: '/settings/profile' }],
  },
];

describe('normalizePath', () => {
  it('drops query, hash and trailing slashes', () => {
    expect(normalizePath('/a/b/?x=1#y')).toBe('/a/b');
    expect(normalizePath('/a//')).toBe('/a');
    expect(normalizePath('/')).toBe('/');
    expect(normalizePath('')).toBe('/');
    expect(normalizePath('?x=1')).toBe('/');
  });
});

describe('matchLength', () => {
  const orders = flattenNavItems(items).find((item) => item.id === 'orders');

  it('matches the href and nested paths on segment boundaries', () => {
    expect(orders && matchLength(orders, '/sales/orders')).toBe('/sales/orders'.length);
    expect(orders && matchLength(orders, '/sales/orders/42')).toBe('/sales/orders'.length);
    expect(orders && matchLength(orders, '/sales/orders-archive')).toBe(-1);
  });

  it('matches extra prefixes', () => {
    expect(orders && matchLength(orders, '/checkout/pay')).toBe('/checkout'.length);
  });

  it('keeps a root link exact', () => {
    const home = flattenNavItems(items).find((item) => item.id === 'home');
    expect(home && matchLength(home, '/')).toBe(1);
    expect(home && matchLength(home, '/sales')).toBe(-1);
  });

  it('honours exact on non-root links', () => {
    expect(matchLength({ id: 'x', label: 'x', href: '/a', exact: true }, '/a/b')).toBe(-1);
    expect(matchLength({ id: 'x', label: 'x', href: '/a', exact: true }, '/a')).toBe(2);
  });

  it('is -1 for items without a link', () => {
    expect(matchLength({ id: 'g', label: 'g' }, '/anything')).toBe(-1);
  });
});

describe('findActiveId', () => {
  it('picks the most specific owner', () => {
    expect(findActiveId(items, '/sales/orders/new')).toBe('new-order');
    expect(findActiveId(items, '/sales/orders/42')).toBe('orders');
    expect(findActiveId(items, '/settings/profile')).toBe('profile');
    expect(findActiveId(items, '/settings')).toBe('settings');
  });

  it('handles root, query strings and unknown paths', () => {
    expect(findActiveId(items, '/')).toBe('home');
    expect(findActiveId(items, '/sales/orders?page=2')).toBe('orders');
    expect(findActiveId(items, '/nowhere')).toBeNull();
  });
});

describe('expansion', () => {
  it('finds ancestors outermost first', () => {
    expect(ancestorIds(items, 'monthly')).toEqual(['sales', 'reports']);
    expect(ancestorIds(items, 'orders')).toEqual(['sales']);
    expect(ancestorIds(items, 'home')).toEqual([]);
    expect(ancestorIds(items, 'missing')).toEqual([]);
  });

  it('opens the groups that contain the active item', () => {
    expect(initialExpandedIds(items, '/sales/reports/monthly')).toEqual(['sales', 'reports']);
    expect(initialExpandedIds(items, '/')).toEqual([]);
    expect(initialExpandedIds(items, '/nowhere')).toEqual([]);
  });

  it('toggles a group open and closed', () => {
    expect(toggleExpanded(items, [], 'sales')).toEqual(['sales']);
    expect(toggleExpanded(items, ['sales'], 'sales')).toEqual([]);
    expect(toggleExpanded(items, ['sales'], 'settings')).toEqual(['sales', 'settings']);
  });

  it('closes siblings in accordion mode but keeps ancestors', () => {
    expect(toggleExpanded(items, ['sales'], 'settings', { single: true })).toEqual(['settings']);
    expect(toggleExpanded(items, ['sales', 'settings'], 'reports', { single: true })).toEqual([
      'sales',
      'reports',
    ]);
  });
});

describe('badges', () => {
  const byId = (id: string) => flattenNavItems(items).find((item) => item.id === id);

  it('sums a group with its children', () => {
    const sales = byId('sales');
    const home = byId('home');
    expect(sales && totalBadge(sales)).toBe(4);
    expect(home && totalBadge(home)).toBe(0);
  });

  it('caps the displayed number', () => {
    expect(formatBadge(7)).toBe('7');
    expect(formatBadge(99)).toBe('99');
    expect(formatBadge(100)).toBe('99+');
    expect(formatBadge(12, 9)).toBe('9+');
  });
});

describe('filterNavItems', () => {
  it('removes rejected items and empties groups without a link', () => {
    const filtered = filterNavItems(
      items,
      (item) => item.id !== 'orders' && item.id !== 'new-order' && item.id !== 'monthly',
    );
    expect(filtered.map((item) => item.id)).toEqual(['home', 'settings']);
  });

  it('keeps a group that is a link even when its children are all removed', () => {
    const filtered = filterNavItems(items, (item) => item.id !== 'profile');
    const settings = filtered.find((item) => item.id === 'settings');
    expect(settings?.children).toEqual([]);
  });

  it('does not mutate the input', () => {
    const before = flattenNavItems(items).length;
    filterNavItems(items, () => false);
    expect(flattenNavItems(items)).toHaveLength(before);
  });
});

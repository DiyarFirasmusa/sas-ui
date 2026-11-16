import { describe, expect, it } from 'vitest';
import { nextTabIndex, panelDomId, tabDomId } from '@/lib/tab-bar';

describe('tab ids', () => {
  it('derives the tab and panel ids from the item id, scoped by an optional prefix', () => {
    expect(tabDomId('a')).toBe('tab-a');
    expect(panelDomId('a')).toBe('tabpanel-a');
    expect(tabDomId('a', ':r1:')).toBe(':r1:-tab-a');
    expect(panelDomId('a', ':r1:')).toBe(':r1:-tabpanel-a');
  });
});

describe('nextTabIndex', () => {
  // Tab 1 is disabled, so only 0, 2 and 3 can take focus.
  const enabled = [0, 2, 3];

  it('moves forward with ArrowRight in LTR, skipping disabled tabs and wrapping', () => {
    expect(nextTabIndex('ArrowRight', enabled, 0, 'ltr')).toBe(2);
    expect(nextTabIndex('ArrowRight', enabled, 3, 'ltr')).toBe(0);
  });

  it('moves backward with ArrowLeft in LTR and wraps', () => {
    expect(nextTabIndex('ArrowLeft', enabled, 2, 'ltr')).toBe(0);
    expect(nextTabIndex('ArrowLeft', enabled, 0, 'ltr')).toBe(3);
  });

  it('flips the arrows in RTL', () => {
    expect(nextTabIndex('ArrowLeft', enabled, 0, 'rtl')).toBe(2);
    expect(nextTabIndex('ArrowRight', enabled, 2, 'rtl')).toBe(0);
    expect(nextTabIndex('ArrowRight', enabled, 0, 'rtl')).toBe(3);
  });

  it('jumps to the ends with Home and End in both directions', () => {
    expect(nextTabIndex('Home', enabled, 3, 'ltr')).toBe(0);
    expect(nextTabIndex('End', enabled, 0, 'rtl')).toBe(3);
  });

  it('ignores other keys, unknown or disabled current tabs, and an empty list', () => {
    expect(nextTabIndex('a', enabled, 0, 'ltr')).toBeUndefined();
    expect(nextTabIndex('ArrowRight', enabled, 1, 'ltr')).toBeUndefined();
    expect(nextTabIndex('ArrowRight', [], 0, 'ltr')).toBeUndefined();
  });

  it('stays on a lone enabled tab', () => {
    expect(nextTabIndex('ArrowRight', [2], 2, 'ltr')).toBe(2);
  });
});

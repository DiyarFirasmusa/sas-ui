import type { Direction } from '@/lib/locale';

/** DOM id of a tab button; the panel's `aria-labelledby` points here. */
export function tabDomId(id: string, idPrefix?: string): string {
  return idPrefix ? `${idPrefix}-tab-${id}` : `tab-${id}`;
}

/** DOM id of a tab's panel; the tab's `aria-controls` points here. */
export function panelDomId(id: string, idPrefix?: string): string {
  return idPrefix ? `${idPrefix}-tabpanel-${id}` : `tabpanel-${id}`;
}

/**
 * The tab to move to for a key press, or undefined when the key is not a
 * navigation key. `enabled` lists the indexes of the tabs that can take focus;
 * `current` is the index of the tab that has it. Arrow keys follow the reading
 * direction (ArrowRight goes to the previous tab in RTL), wrap around at the
 * ends, and Home/End jump to the first/last enabled tab. A disabled tab is
 * never returned.
 */
export function nextTabIndex(
  key: string,
  enabled: readonly number[],
  current: number,
  direction: Direction,
): number | undefined {
  const position = enabled.indexOf(current);
  if (position === -1) {
    return undefined;
  }
  const forwardKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const backwardKey = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
  if (key === forwardKey) {
    return enabled[(position + 1) % enabled.length];
  }
  if (key === backwardKey) {
    return enabled[(position - 1 + enabled.length) % enabled.length];
  }
  if (key === 'Home') {
    return enabled[0];
  }
  if (key === 'End') {
    return enabled.at(-1);
  }
  return undefined;
}

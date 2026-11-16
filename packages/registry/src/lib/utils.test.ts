import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('joins and drops falsy values', () => {
    expect(cn('a', false, undefined, null, 'b', { c: true, d: false })).toBe('a b c');
  });

  it('lets the later conflicting utility win', () => {
    expect(cn('px-2 px-4')).toBe('px-4');
    expect(cn('bg-surface bg-primary')).toBe('bg-primary');
  });

  it('does not treat the type ramp as a colour', () => {
    expect(cn('text-h1 text-text-muted')).toBe('text-h1 text-text-muted');
    expect(cn('text-text-muted text-h1')).toBe('text-text-muted text-h1');
  });

  it('replaces one type-ramp utility with another', () => {
    expect(cn('text-b1 text-h3')).toBe('text-h3');
  });

  it('keeps role spacing and role radii in their own groups', () => {
    expect(cn('p-card p-row')).toBe('p-row');
    expect(cn('gap-field gap-card')).toBe('gap-card');
    expect(cn('rounded-control rounded-pill')).toBe('rounded-pill');
    expect(cn('shadow-small shadow-large')).toBe('shadow-large');
  });

  it('knows the extra ramp and radius names the existing dashboards use', () => {
    expect(cn('text-display text-text-muted')).toBe('text-display text-text-muted');
    expect(cn('text-table-id text-h4')).toBe('text-h4');
    expect(cn('rounded-nav rounded-kpi')).toBe('rounded-kpi');
  });

  it('keeps logical utilities apart from each other', () => {
    expect(cn('ps-2 pe-4')).toBe('ps-2 pe-4');
    expect(cn('ps-2 ps-4')).toBe('ps-4');
  });
});

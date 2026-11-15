import { describe, expect, it } from 'vitest';
import { unifiedDiff } from './unified-diff.ts';

describe('unifiedDiff', () => {
  it('reports identical text as unchanged', () => {
    expect(unifiedDiff('a\nb', 'a\nb')).toEqual({ changed: false, text: '', added: 0, removed: 0 });
  });

  it('marks added and removed lines with context', () => {
    const before = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'].join('\n');
    const after = ['one', 'two', 'three', 'FOUR', 'five', 'six', 'seven', 'eight'].join('\n');
    const result = unifiedDiff(before, after);
    expect(result.changed).toBe(true);
    expect(result.added).toBe(1);
    expect(result.removed).toBe(1);
    expect(result.text).toContain('-four');
    expect(result.text).toContain('+FOUR');
  });

  it('collapses long unchanged stretches', () => {
    const lines = Array.from({ length: 40 }, (_, index) => `line ${index}`);
    const changed = [...lines];
    changed[39] = 'changed';
    expect(unifiedDiff(lines.join('\n'), changed.join('\n')).text).toContain('@@ … @@');
  });

  it('handles trailing additions', () => {
    const result = unifiedDiff('a', 'a\nb');
    expect(result.added).toBe(1);
    expect(result.removed).toBe(0);
  });
});

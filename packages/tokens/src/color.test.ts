import { describe, expect, it } from 'vitest';
import { contrastRatio, parseColor, resolveOver } from './color.ts';

describe('color', () => {
  it('parses hex, short hex and rgb with alpha', () => {
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor('#0c1522')).toEqual({ r: 12, g: 21, b: 34, a: 1 });
    expect(parseColor('rgb(31 111 106 / 0.09)')).toEqual({ r: 31, g: 111, b: 106, a: 0.09 });
  });

  it('rejects colours it cannot measure', () => {
    expect(() => parseColor('oklch(0.5 0.1 20)')).toThrow(/Unsupported/);
  });

  it('matches the WCAG reference ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 1);
  });

  it('composites translucent colours over a surface', () => {
    expect(resolveOver('rgb(0 0 0 / 0.5)', '#ffffff')).toBe('#808080');
  });
});

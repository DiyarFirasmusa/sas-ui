// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { themeCss } from './theme-css.ts';

const foundation = readFileSync(new URL('./css/foundation.css', import.meta.url), 'utf8');

describe('theme css', () => {
  const css = themeCss(foundation);

  it('defines the skeleton shimmer utility and its keyframes', () => {
    expect(css).toContain('--animate-skeleton-shimmer: skeleton-shimmer');
    expect(css).toMatch(/@keyframes skeleton-shimmer\s*\{/);
  });

  it('declares the shimmer inside the foundation @theme block (before the first @utility)', () => {
    const start = css.indexOf('--font-sans');
    const shimmer = css.indexOf('--animate-skeleton-shimmer');
    expect(shimmer).toBeGreaterThan(start);
    expect(shimmer).toBeLessThan(css.indexOf('@utility'));
  });

  it('still switches animations off for reduced motion', () => {
    expect(css).toMatch(
      /prefers-reduced-motion: reduce[\s\S]*animation-duration: 0\.01ms !important/,
    );
  });
});

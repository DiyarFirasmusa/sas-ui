import { describe, expect, it } from 'vitest';
import { parseRoute } from './use-hash-route';

describe('parseRoute', () => {
  it('reads a block preview and an optional 1-based example', () => {
    expect(parseRoute('#/preview/shell-01')).toEqual({ page: 'preview', name: 'shell-01' });
    expect(parseRoute('#/preview/shell-01/4')).toEqual({
      page: 'preview',
      name: 'shell-01',
      example: 4,
    });
  });

  it('keeps the other routes', () => {
    expect(parseRoute('#/blocks/shell-01')).toEqual({ page: 'block', name: 'shell-01' });
    expect(parseRoute('#/nowhere')).toEqual({ page: 'home' });
  });
});

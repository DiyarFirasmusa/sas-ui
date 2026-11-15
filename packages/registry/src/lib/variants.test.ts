import { describe, expect, it } from 'vitest';
import { variants, type VariantProps } from '@/lib/variants';

const box = variants('base', {
  variants: {
    tone: { primary: 'bg-primary', danger: 'bg-danger' },
    size: { sm: 'p-1', lg: 'p-4' },
    flat: { true: 'shadow-none', false: 'shadow-large' },
  },
  defaultVariants: { tone: 'primary', size: 'sm', flat: false },
  compoundVariants: [{ tone: 'danger', size: 'lg', class: 'ring-2' }],
});

describe('variants', () => {
  it('applies defaults', () => {
    expect(box()).toBe('base bg-primary p-1 shadow-large');
  });

  it('applies selections and lets className override', () => {
    expect(box({ tone: 'danger', className: 'bg-info' })).toBe('base p-1 shadow-large bg-info');
  });

  it('supports boolean variants', () => {
    expect(box({ flat: true })).toContain('shadow-none');
  });

  it('applies compound variants only when every condition matches', () => {
    expect(box({ tone: 'danger', size: 'lg' })).toContain('ring-2');
    expect(box({ tone: 'danger' })).not.toContain('ring-2');
  });

  it('treats null as "no variant"', () => {
    expect(box({ tone: null })).toBe('base p-1 shadow-large');
  });

  it('exposes variant props without className', () => {
    const props: VariantProps<typeof box> = { tone: 'danger', size: 'lg' };
    expect(box(props)).toContain('bg-danger');
  });
});

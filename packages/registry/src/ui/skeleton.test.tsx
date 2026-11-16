import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton, SkeletonTable, SkeletonText } from '@/components/ui/skeleton';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('Skeleton', () => {
  it('is a decorative pulse block that stops pulsing for reduced motion', () => {
    const { container } = render(<Skeleton className="h-4 w-20" />);
    const block = container.querySelector('[data-slot="skeleton"]');
    expect(block).toHaveAttribute('aria-hidden', 'true');
    expect(block).toHaveClass('animate-pulse', 'motion-reduce:animate-none', 'h-4', 'w-20');
  });

  it('shimmer swaps the pulse for the sweeping highlight and still honours reduced motion', () => {
    const { container } = render(<Skeleton shimmer className="h-4" />);
    const block = container.querySelector('[data-slot="skeleton"]');
    expect(block).toHaveAttribute('data-shimmer');
    expect(block).toHaveClass('animate-skeleton-shimmer', 'motion-reduce:animate-none', 'h-4');
    expect(block).not.toHaveClass('animate-pulse');
  });

  it('pulses by default (no shimmer marker)', () => {
    const { container } = render(<Skeleton />);
    const block = container.querySelector('[data-slot="skeleton"]');
    expect(block).not.toHaveAttribute('data-shimmer');
    expect(block).not.toHaveClass('animate-skeleton-shimmer');
  });

  it('SkeletonText and SkeletonTable pass shimmer to every block', () => {
    const { container } = render(
      <div>
        <SkeletonText lines={2} shimmer />
        <SkeletonTable rows={1} columns={2} shimmer />
      </div>,
    );
    const blocks = container.querySelectorAll('[data-slot="skeleton"]');
    expect(blocks).toHaveLength(2 + 4);
    for (const block of blocks) {
      expect(block).toHaveAttribute('data-shimmer');
    }
  });

  it('SkeletonText renders the requested lines with a shorter last line', () => {
    const { container } = render(<SkeletonText lines={4} />);
    const lines = container.querySelectorAll('[data-slot="skeleton"]');
    expect(lines).toHaveLength(4);
    expect(lines[3]).toHaveClass('w-3/5');
    expect(lines[0]).toHaveClass('w-full');
  });

  it('a single text line is full width', () => {
    const { container } = render(<SkeletonText lines={1} />);
    expect(container.querySelector('[data-slot="skeleton"]')).toHaveClass('w-full');
  });

  it('SkeletonTable renders a header plus the requested rows and columns', () => {
    const { container } = render(<SkeletonTable rows={3} columns={2} />);
    // header row + 3 rows, 2 cells each
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(8);
  });

  it('announces the loading region in the active language', () => {
    renderWithLocale(<SkeletonText />, { locale: 'ar' });
    expect(screen.getByRole('status', { name: 'جارٍ التحميل' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('accepts a custom label', () => {
    render(<SkeletonTable label="Loading invoices" />);
    expect(screen.getByRole('status', { name: 'Loading invoices' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <SkeletonText />
        <SkeletonTable rows={2} columns={3} shimmer />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

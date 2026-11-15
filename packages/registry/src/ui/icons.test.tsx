import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChevronRightIcon, CloseIcon } from '@/components/ui/icons';

describe('icons', () => {
  it('are decorative unless labelled', () => {
    const { container } = render(<CloseIcon />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('expose a role and name when given aria-label', () => {
    render(<CloseIcon aria-label="Close" />);
    expect(screen.getByRole('img', { name: 'Close' })).toBeInTheDocument();
  });

  it('mirror directional glyphs in RTL only', () => {
    const { container } = render(
      <>
        <ChevronRightIcon />
        <CloseIcon />
      </>,
    );
    const [chevron, close] = container.querySelectorAll('svg');
    expect(chevron).toHaveClass('rtl:-scale-x-100');
    expect(close).not.toHaveClass('rtl:-scale-x-100');
  });

  it('merges a custom size over the default', () => {
    const { container } = render(<CloseIcon className="size-6" />);
    expect(container.querySelector('svg')).toHaveClass('size-6');
    expect(container.querySelector('svg')).not.toHaveClass('size-4');
  });
});

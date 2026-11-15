import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Slot } from '@/lib/slot';

describe('Slot', () => {
  it('merges props and classes onto the child', () => {
    render(
      <Slot className="px-2 text-b1" data-slot="x">
        <a href="/home" className="px-4">
          Home
        </a>
      </Slot>,
    );
    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveAttribute('data-slot', 'x');
    expect(link).toHaveClass('px-4', 'text-b1');
    expect(link).not.toHaveClass('px-2');
  });

  it('renders nothing for a non-element child', () => {
    const { container } = render(<Slot>text</Slot>);
    expect(container).toBeEmptyDOMElement();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from '@/components/ui/badge';
import { expectNoA11yViolations } from '@/test/a11y';

describe('Badge', () => {
  it('defaults to the neutral tag pair', () => {
    render(<Badge>Draft</Badge>);
    expect(screen.getByText('Draft')).toHaveClass(
      'bg-tag-neutral-container',
      'text-text-secondary',
    );
  });

  it.each(['green', 'red', 'yellow', 'orange', 'cyan', 'purple', 'blue'] as const)(
    'maps the %s tone to its tag pair',
    (tone) => {
      render(<Badge tone={tone}>x</Badge>);
      expect(screen.getByText('x')).toHaveClass(`bg-tag-${tone}-container`, `text-tag-${tone}`);
    },
  );

  it('supports an outline treatment and class overrides', () => {
    render(
      <Badge tone="green" outline className="px-4">
        Paid
      </Badge>,
    );
    expect(screen.getByText('Paid')).toHaveClass('border', 'px-4');
  });

  it('is a 26px pill by default and 22px at size sm', () => {
    const { rerender } = render(<Badge>Draft</Badge>);
    expect(screen.getByText('Draft')).toHaveClass('h-[26px]', 'rounded-pill', 'px-inline');
    rerender(<Badge size="sm">Draft</Badge>);
    expect(screen.getByText('Draft')).toHaveClass('h-[22px]', 'px-field');
  });

  it('draws a status dot without a container with the dot prop', () => {
    const { container } = render(
      <Badge tone="green" dot>
        Active
      </Badge>,
    );
    const badge = screen.getByText('Active');
    expect(badge).toHaveClass('bg-transparent', 'px-0', 'text-tag-green');
    const dot = container.querySelector('[data-slot="badge-dot"]');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(dot).toHaveClass('bg-current');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Badge tone="red">Overdue</Badge>);
    await expectNoA11yViolations(container);
  });
});

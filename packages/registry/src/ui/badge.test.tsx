import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from '@/components/ui/badge';
import { expectNoA11yViolations } from '@/test/a11y';

describe('Badge', () => {
  it('defaults to the neutral tag pair', () => {
    render(<Badge>Draft</Badge>);
    expect(screen.getByText('Draft')).toHaveClass('bg-tag-neutral-container', 'text-tag-neutral');
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

  it('has no axe violations', async () => {
    const { container } = render(<Badge tone="red">Overdue</Badge>);
    await expectNoA11yViolations(container);
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Label } from '@/components/ui/label';
import { expectNoA11yViolations } from '@/test/a11y';

describe('Label', () => {
  it('labels its control', () => {
    render(
      <>
        <Label htmlFor="n">Name</Label>
        <input id="n" />
      </>,
    );
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('shows a decorative required marker', () => {
    render(<Label required>Name</Label>);
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <Label htmlFor="n">Name</Label>
        <input id="n" />
      </>,
    );
    await expectNoA11yViolations(container);
  });
});

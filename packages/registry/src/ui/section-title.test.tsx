import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionTitle } from '@/components/ui/section-title';
import { expectNoA11yViolations } from '@/test/a11y';

describe('SectionTitle', () => {
  it('renders an h2 by default and honours the level', () => {
    const { rerender } = render(<SectionTitle title="Details" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Details' })).toBeInTheDocument();
    rerender(<SectionTitle title="Details" level={3} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Details' })).toBeInTheDocument();
  });

  it('shows description, icon and action', () => {
    render(
      <SectionTitle
        title="Team"
        description="People on this project"
        icon={<svg data-testid="icon" />}
        action={<button type="button">Add</button>}
      />,
    );
    expect(screen.getByText('People on this project')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<SectionTitle title="Team" description="x" />);
    await expectNoA11yViolations(container);
  });
});

describe('SectionTitle accent', () => {
  it('draws the primary accent bar before the title, or the gold one', () => {
    const { container, rerender } = render(<SectionTitle title="Details" />);
    const bar = () => container.querySelector('[data-slot="section-title-accent"]');
    expect(bar()).toHaveClass('bg-primary', 'w-1');
    expect(bar()).toHaveAttribute('aria-hidden', 'true');
    rerender(<SectionTitle title="Details" accent="gold" />);
    expect(bar()).toHaveClass('bg-primary-highlight');
  });

  it('swaps the bar for the icon tile when an icon is given', () => {
    const { container } = render(<SectionTitle title="Details" icon={<svg />} />);
    expect(container.querySelector('[data-slot="section-title-accent"]')).not.toBeInTheDocument();
  });
});

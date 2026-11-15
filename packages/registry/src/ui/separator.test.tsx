import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Separator } from '@/components/ui/separator';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('Separator', () => {
  it('is a horizontal separator by default', () => {
    render(<Separator />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    expect(separator).toHaveClass('h-px', 'w-full');
  });

  it('supports the vertical orientation', () => {
    render(<Separator orientation="vertical" />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    expect(separator).toHaveClass('w-px');
  });

  it('hides a decorative separator from the accessibility tree', () => {
    render(<Separator decorative data-testid="line" />);
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expect(screen.getByTestId('line')).toHaveAttribute('role', 'none');
    expect(screen.getByTestId('line')).not.toHaveAttribute('aria-orientation');
  });

  it('merges className', () => {
    render(<Separator className="my-4" />);
    expect(screen.getByRole('separator')).toHaveClass('my-4');
  });

  it('renders the same in Arabic', () => {
    renderWithLocale(<Separator orientation="vertical" />, { locale: 'ar' });
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('has no axe violations (semantic and decorative)', async () => {
    render(
      <div>
        <Separator />
        <Separator decorative />
        <Separator orientation="vertical" />
      </div>,
    );
    await expectNoA11yViolations();
  });
});

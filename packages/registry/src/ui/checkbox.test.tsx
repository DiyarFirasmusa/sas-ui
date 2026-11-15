import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from '@/components/ui/checkbox';
import { expectNoA11yViolations } from '@/test/a11y';

describe('Checkbox', () => {
  it('toggles and reports the change', async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="Accept" onCheckedChange={onCheckedChange} />);
    const box = screen.getByRole('checkbox', { name: 'Accept' });
    await userEvent.click(box);
    expect(box).toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it('toggles with the keyboard', async () => {
    render(<Checkbox aria-label="Accept" />);
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('exposes the indeterminate state', () => {
    render(<Checkbox aria-label="All" indeterminate />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed');
  });

  it('cannot be toggled when disabled', async () => {
    render(<Checkbox aria-label="Locked" disabled />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Checkbox aria-label="Accept" defaultChecked />);
    await expectNoA11yViolations(container);
  });
});

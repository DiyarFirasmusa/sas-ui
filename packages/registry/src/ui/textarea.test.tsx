import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Textarea } from '@/components/ui/textarea';
import { expectNoA11yViolations } from '@/test/a11y';

describe('Textarea', () => {
  it('follows the typed language once it has content', async () => {
    render(<Textarea aria-label="Notes" />);
    const area = screen.getByLabelText('Notes');
    expect(area).not.toHaveAttribute('dir');
    await userEvent.type(area, 'ملاحظة');
    expect(area).toHaveAttribute('dir', 'auto');
    expect(area).toHaveValue('ملاحظة');
  });

  it('respects the disabled and placeholder props', () => {
    render(<Textarea aria-label="Notes" placeholder="Write…" disabled />);
    expect(screen.getByPlaceholderText('Write…')).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Textarea aria-label="Notes" />);
    await expectNoA11yViolations(container);
  });
});

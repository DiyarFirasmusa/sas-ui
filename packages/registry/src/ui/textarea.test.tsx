import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Textarea } from '@/components/ui/textarea';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

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

  it('forwards the caller ref to the textarea (so a form can focus it)', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea aria-label="Notes" ref={ref} />);
    expect(ref.current).toBe(screen.getByLabelText('Notes'));
  });

  it('autoDirection={false} keeps the UI direction while typing', async () => {
    render(<Textarea aria-label="Notes" autoDirection={false} />);
    const area = screen.getByLabelText('Notes');
    await userEvent.type(area, 'ملاحظة');
    expect(area).not.toHaveAttribute('dir');
  });

  it('size="lg" is opt-in and leaves the default untouched', () => {
    render(
      <>
        <Textarea aria-label="Plain" />
        <Textarea aria-label="Large" size="lg" />
      </>,
    );
    expect(screen.getByLabelText('Plain')).toHaveClass('min-h-24', 'py-3', 'h-auto', 'resize-y');
    expect(screen.getByLabelText('Plain')).toHaveAttribute('data-size', 'default');
    expect(screen.getByLabelText('Large')).toHaveClass('min-h-28', 'py-3');
  });

  it('works in Arabic with no axe violations', async () => {
    const { container } = renderWithLocale(<Textarea aria-label="ملاحظات" size="lg" />, {
      locale: 'ar',
    });
    await userEvent.type(screen.getByLabelText('ملاحظات'), 'نص');
    expect(screen.getByLabelText('ملاحظات')).toHaveAttribute('dir', 'auto');
    await expectNoA11yViolations(container);
  });

  it('has no axe violations', async () => {
    const { container } = render(<Textarea aria-label="Notes" />);
    await expectNoA11yViolations(container);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Field } from '@/components/ui/field';
import { NumberInput } from '@/components/ui/number-input';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('NumberInput', () => {
  it('steps with the buttons within min and max', async () => {
    const onValueChange = vi.fn();
    render(
      <NumberInput
        aria-label="Qty"
        defaultValue={4}
        min={3}
        max={5}
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Qty' });
    await userEvent.click(screen.getByRole('button', { name: 'Increase' }));
    expect(input).toHaveValue('5');
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Decrease' }));
    await userEvent.click(screen.getByRole('button', { name: 'Decrease' }));
    expect(input).toHaveValue('3');
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeDisabled();
    expect(onValueChange).toHaveBeenCalledWith(5, expect.anything());
  });

  it('steps with the arrow keys by the given step', async () => {
    render(<NumberInput aria-label="Qty" defaultValue={10} step={5} />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('textbox')).toHaveValue('15');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('textbox')).toHaveValue('5');
  });

  it('clamps typed values to the range on blur', async () => {
    render(<NumberInput aria-label="Qty" defaultValue={1} min={0} max={10} />);
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, '99');
    await userEvent.tab();
    expect(input).toHaveValue('10');
  });

  it('can hide the steppers', () => {
    render(<NumberInput aria-label="Qty" showSteppers={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('is disabled as a whole', async () => {
    render(<NumberInput aria-label="Qty" defaultValue={2} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled();
  });

  it('forwards ref to the input, name and onBlur', async () => {
    const ref = createRef<HTMLInputElement>();
    const onBlur = vi.fn();
    const { container } = render(
      <NumberInput aria-label="Qty" ref={ref} name="qty" defaultValue={1} onBlur={onBlur} />,
    );
    expect(ref.current).toBe(screen.getByRole('textbox'));
    expect(container.querySelector('input[name="qty"]')).not.toBeNull();
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.tab();
    expect(onBlur).toHaveBeenCalled();
  });

  it('works inside Field and shows the invalid state', () => {
    render(
      <Field label="Quantity" error="Must be at least 1">
        <NumberInput />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Quantity' });
    expect(input).toBeInvalid();
    expect(screen.getByRole('alert')).toHaveTextContent('Must be at least 1');
  });

  it('reflects aria-invalid passed directly', () => {
    render(<NumberInput aria-label="Qty" aria-invalid />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows Latin, left-to-right digits and Arabic stepper labels in Arabic', async () => {
    renderWithLocale(<NumberInput aria-label="الكمية" defaultValue={1234} />, {
      locale: 'ar',
    });
    const input = screen.getByRole('textbox', { name: 'الكمية' });
    expect(input).toHaveValue('1,234');
    expect(input).toHaveAttribute('dir', 'ltr');
    expect(input).toHaveAttribute('aria-roledescription', 'حقل رقمي');
    await userEvent.click(screen.getByRole('button', { name: 'زيادة' }));
    expect(input).toHaveValue('1,235');
    expect(screen.getByRole('button', { name: 'إنقاص' })).toBeInTheDocument();
  });

  it('puts the 28px steppers together at the end edge, after the input', () => {
    render(<NumberInput aria-label="Qty" />);
    const input = screen.getByRole('textbox', { name: 'Qty' });
    const decrease = screen.getByRole('button', { name: 'Decrease' });
    const increase = screen.getByRole('button', { name: 'Increase' });
    expect(input.compareDocumentPosition(decrease) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      decrease.compareDocumentPosition(increase) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(decrease).toHaveClass('size-7', 'rounded-control');
    expect(increase).toHaveClass('size-7', 'rounded-control');
    expect(input).toHaveClass('text-control-input', 'text-start');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Field label="Quantity" description="Pieces per box">
        <NumberInput defaultValue={3} />
      </Field>,
    );
    await expectNoA11yViolations(container);
  });
});

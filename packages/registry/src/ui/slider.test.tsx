import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Field } from '@/components/ui/field';
import { Slider } from '@/components/ui/slider';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('Slider', () => {
  it('renders one labelled thumb and steps with the keyboard', async () => {
    const onValueChange = vi.fn();
    render(<Slider aria-label="Volume" defaultValue={20} step={5} onValueChange={onValueChange} />);
    const thumb = screen.getByRole('slider', { name: 'Volume' });
    expect(thumb).toHaveAttribute('aria-valuenow', '20');
    await userEvent.tab();
    expect(thumb).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenLastCalledWith(25, expect.anything());
    expect(thumb).toHaveAttribute('aria-valuenow', '25');
  });

  it('renders a range with a named thumb per end', async () => {
    const onValueChange = vi.fn();
    render(<Slider aria-label="Price" defaultValue={[10, 80]} onValueChange={onValueChange} />);
    const low = screen.getByRole('slider', { name: 'Price – Minimum' });
    const high = screen.getByRole('slider', { name: 'Price – Maximum' });
    expect(low).toHaveAttribute('aria-valuenow', '10');
    expect(high).toHaveAttribute('aria-valuenow', '80');
    low.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenLastCalledWith([11, 80], expect.anything());
  });

  it('shows the value, with Latin digits, only on request', () => {
    const { rerender } = render(<Slider aria-label="Rate" defaultValue={[10, 80]} showValue />);
    expect(screen.getByText(/10.*80/)).toHaveAttribute('dir', 'ltr');
    rerender(<Slider aria-label="Rate" defaultValue={[10, 80]} />);
    expect(screen.queryByText(/10.*80/)).not.toBeInTheDocument();
  });

  it('cannot be changed when disabled', async () => {
    render(<Slider aria-label="Volume" defaultValue={20} disabled />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '20');
    expect(screen.getByRole('slider')).toBeDisabled();
  });

  it('forwards ref, name and onBlur', async () => {
    const ref = createRef<HTMLDivElement>();
    const onBlur = vi.fn();
    render(
      <>
        <Slider aria-label="Volume" ref={ref} name="volume" defaultValue={30} onBlur={onBlur} />
        <button type="button">next</button>
      </>,
    );
    expect(ref.current).toHaveAttribute('data-slot', 'slider');
    expect(screen.getByRole('slider')).toHaveAttribute('name', 'volume');
    await userEvent.tab();
    await userEvent.tab();
    expect(onBlur).toHaveBeenCalled();
  });

  it('works inside Field and reflects the invalid state', () => {
    render(
      <Field label="Budget" error="Too low">
        <Slider defaultValue={5} />
      </Field>,
    );
    expect(screen.getByRole('slider', { name: 'Budget' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Too low');
    expect(document.querySelector('[data-slot="slider"]')).toHaveAttribute('data-invalid');
  });

  it('mirrors the arrow keys in Arabic and names range thumbs in Arabic', async () => {
    const onValueChange = vi.fn();
    renderWithLocale(
      <Slider aria-label="السعر" defaultValue={[10, 80]} onValueChange={onValueChange} />,
      { locale: 'ar' },
    );
    const low = screen.getByRole('slider', { name: 'السعر – الحد الأدنى' });
    expect(screen.getByRole('slider', { name: 'السعر – الحد الأعلى' })).toBeInTheDocument();
    low.focus();
    // In RTL the ArrowLeft key moves toward the maximum.
    await userEvent.keyboard('{ArrowLeft}');
    expect(onValueChange).toHaveBeenLastCalledWith([11, 80], expect.anything());
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Field label="Volume" description="0 to 100">
        <Slider defaultValue={[20, 60]} showValue />
      </Field>,
    );
    await expectNoA11yViolations(container);
  });
});

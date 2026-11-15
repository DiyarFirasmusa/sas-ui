import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Field } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { renderWithLocale } from '@/test/render';
import { expectNoA11yViolations } from '@/test/a11y';

function Plans(props: Partial<React.ComponentProps<typeof RadioGroup>>) {
  return (
    <RadioGroup aria-label="Plan" {...props}>
      <RadioGroupItem value="free" label="Free" />
      <RadioGroupItem value="pro" label="Pro" description="For teams" />
      <RadioGroupItem value="legacy" label="Legacy" disabled />
    </RadioGroup>
  );
}

describe('RadioGroup', () => {
  it('selects an option by clicking its label and reports the value', async () => {
    const onValueChange = vi.fn();
    render(<Plans onValueChange={onValueChange} />);
    await userEvent.click(screen.getByText('Pro'));
    expect(screen.getByRole('radio', { name: /Pro/ })).toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith('pro', expect.anything());
  });

  it('is operable with the keyboard', async () => {
    render(<Plans defaultValue="free" />);
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Free' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: /Pro/ })).toBeChecked();
  });

  it('skips disabled options and does not select them', async () => {
    render(<Plans defaultValue="pro" />);
    await userEvent.click(screen.getByText('Legacy'));
    expect(screen.getByRole('radio', { name: 'Legacy' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: /Pro/ })).toBeChecked();
  });

  it('disables the whole group', async () => {
    render(<Plans disabled />);
    await userEvent.click(screen.getByText('Free'));
    expect(screen.getByRole('radio', { name: 'Free' })).not.toBeChecked();
  });

  it('lays out horizontally on request', () => {
    render(<Plans orientation="horizontal" />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('data-orientation', 'horizontal');
    expect(screen.getByRole('radiogroup').className).toContain('flex-row');
  });

  it('forwards ref, name and onBlur to the group', async () => {
    const ref = createRef<HTMLDivElement>();
    const onBlur = vi.fn();
    const { container } = render(
      <>
        <Plans ref={ref} name="plan" defaultValue="free" onBlur={onBlur} />
        <button type="button">next</button>
      </>,
    );
    expect(ref.current).toBe(screen.getByRole('radiogroup'));
    expect(container.querySelector('input[name="plan"]')).not.toBeNull();
    await userEvent.tab();
    await userEvent.tab();
    expect(onBlur).toHaveBeenCalled();
  });

  it('works inside Field: the label names the group and the error marks it invalid', () => {
    render(
      <Field label="Plan" error="Choose a plan">
        <RadioGroup>
          <RadioGroupItem value="free" label="Free" />
          <RadioGroupItem value="pro" label="Pro" />
        </RadioGroup>
      </Field>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Plan' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a plan');
    expect(screen.getByRole('radio', { name: 'Free' })).toHaveAttribute('data-invalid');
  });

  it('marks options invalid from aria-invalid on the group', () => {
    render(<Plans aria-invalid />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true');
  });

  it('moves the choice with the arrow keys in the reading direction (Arabic)', async () => {
    renderWithLocale(
      <RadioGroup aria-label="الخطة" orientation="horizontal" defaultValue="a">
        <RadioGroupItem value="a" label="مجاني" />
        <RadioGroupItem value="b" label="احترافي" />
      </RadioGroup>,
      { locale: 'ar' },
    );
    await userEvent.tab();
    // In RTL the next option sits to the left.
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'احترافي' })).toBeChecked();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Field label="Plan" description="Pick one" error="Required">
        <RadioGroup>
          <RadioGroupItem value="free" label="Free" />
          <RadioGroupItem value="pro" label="Pro" />
        </RadioGroup>
      </Field>,
    );
    await expectNoA11yViolations(container);
  });
});

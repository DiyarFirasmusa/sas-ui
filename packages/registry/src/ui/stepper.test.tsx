import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Stepper, type StepperStep } from '@/components/ui/stepper';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const steps: StepperStep[] = [
  { label: 'Account', description: 'Your details' },
  { label: 'Payment' },
  { label: 'Review' },
  { label: 'Done' },
];

describe('Stepper', () => {
  it('derives complete, current and upcoming states from `current`', () => {
    render(<Stepper steps={steps} current={1} />);
    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.getAttribute('data-state'))).toEqual([
      'complete',
      'current',
      'upcoming',
      'upcoming',
    ]);
  });

  it('marks only the current step with aria-current="step"', () => {
    render(<Stepper steps={steps} current={2} />);
    const marked = screen
      .getAllByRole('listitem')
      .filter((item) => item.hasAttribute('aria-current'));
    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveAttribute('aria-current', 'step');
    expect(marked[0]).toHaveTextContent('Review');
  });

  it('spells out each state for screen readers', () => {
    render(<Stepper steps={steps} current={1} />);
    const [first, second, third] = screen.getAllByRole('listitem');
    expect(first).toHaveTextContent('Step 1 of 4, completed');
    expect(second).toHaveTextContent('Step 2 of 4, current step');
    expect(third).toHaveTextContent('Step 3 of 4, not started');
  });

  it('shows an error step distinctly and keeps it announced', () => {
    render(
      <Stepper steps={[{ label: 'Account' }, { label: 'Payment', error: true }]} current={1} />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveAttribute('data-state', 'error');
    expect(items[1]).toHaveTextContent('has an error');
    expect(items[1]).not.toHaveAttribute('aria-current');
  });

  it('renders Latin step numbers and a check for complete steps', () => {
    const { container } = render(<Stepper steps={steps} current={1} />);
    const indicators = container.querySelectorAll('[data-slot="stepper-indicator"]');
    expect(indicators[0]?.querySelector('svg')).toBeInTheDocument();
    expect(indicators[1]).toHaveTextContent('2');
    expect(indicators[3]).toHaveTextContent('4');
  });

  it('is not interactive without onStepClick', () => {
    render(<Stepper steps={steps} current={1} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('makes steps buttons with onStepClick and calls it with the index', async () => {
    const onStepClick = vi.fn();
    render(
      <Stepper
        steps={[{ label: 'Account' }, { label: 'Payment' }, { label: 'Review', disabled: true }]}
        current={1}
        onStepClick={onStepClick}
      />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: /Account/ }));
    expect(onStepClick).toHaveBeenCalledWith(0);
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onStepClick).toHaveBeenCalledTimes(2);
  });

  it('supports the vertical orientation', () => {
    const { container } = render(<Stepper steps={steps} current={0} orientation="vertical" />);
    expect(container.querySelector('[data-slot="stepper"]')).toHaveAttribute(
      'data-orientation',
      'vertical',
    );
    expect(container.querySelectorAll('[data-slot="stepper-connector"]')).toHaveLength(3);
  });

  it('draws completed connectors in the primary colour and none after the last step', () => {
    const { container } = render(<Stepper steps={steps} current={2} />);
    const connectors = [...container.querySelectorAll('[data-slot="stepper-connector"]')];
    expect(connectors.map((connector) => connector.classList.contains('bg-primary'))).toEqual([
      true,
      true,
      false,
    ]);
  });

  it('positions connectors with logical offsets, so they follow RTL', () => {
    const { container } = renderWithLocale(<Stepper steps={steps} current={1} />, { locale: 'ar' });
    const connector = container.querySelector('[data-slot="stepper-connector"]');
    expect(connector?.className).toMatch(/start-\[calc/);
    expect(connector?.className).toMatch(/end-\[calc/);
  });

  it('labels in Arabic and keeps Latin digits', () => {
    const { container } = renderWithLocale(
      <Stepper steps={[{ label: 'الحساب' }, { label: 'الدفع' }]} current={1} />,
      { locale: 'ar' },
    );
    expect(screen.getByRole('list', { name: 'التقدم' })).toBeInTheDocument();
    const second = screen.getAllByRole('listitem')[1];
    expect(second).toHaveTextContent('الخطوة 2 من 2');
    expect(within(second as HTMLElement).getByText('2')).toHaveAttribute('dir', 'ltr');
    expect(container.querySelector('[data-state="current"]')).toHaveTextContent('الخطوة الحالية');
  });

  it('accepts a custom list label', () => {
    render(<Stepper steps={steps} current={0} label="Checkout" />);
    expect(screen.getByRole('list', { name: 'Checkout' })).toBeInTheDocument();
  });

  it('has no axe violations (horizontal, vertical, interactive)', async () => {
    const { rerender } = render(<Stepper steps={steps} current={1} />);
    await expectNoA11yViolations();
    rerender(<Stepper steps={steps} current={1} orientation="vertical" />);
    await expectNoA11yViolations();
    rerender(<Stepper steps={steps} current={1} onStepClick={() => {}} />);
    await expectNoA11yViolations();
  });
});

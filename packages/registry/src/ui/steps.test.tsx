import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CheckCircleIcon } from '@/components/ui/icons';
import { Steps, type StepItem } from '@/components/ui/steps';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const items: StepItem[] = [
  { id: 'details', label: 'Details' },
  { id: 'review', label: 'Review' },
  { id: 'submit', label: 'Submit' },
];

describe('Steps', () => {
  it('is a named ordered list with one item per step', () => {
    render(<Steps items={items} current={1} />);
    const list = screen.getByRole('list', { name: 'Progress' });
    expect(list.tagName).toBe('OL');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(list).not.toHaveAttribute('tabindex');
  });

  it('accepts a custom list name', () => {
    render(<Steps items={items} current={0} label="Booking steps" />);
    expect(screen.getByRole('list', { name: 'Booking steps' })).toBeInTheDocument();
  });

  it('marks the current step with aria-current="step" and no other', () => {
    render(<Steps items={items} current={1} />);
    const entries = screen.getAllByRole('listitem');
    expect(entries.map((entry) => entry.getAttribute('aria-current'))).toEqual([
      null,
      'step',
      null,
    ]);
  });

  it('reports complete, current and upcoming states, in text as well as data attributes', () => {
    const { container } = render(<Steps items={items} current={1} />);
    const states = [...container.querySelectorAll('[data-slot="step"]')].map((step) =>
      step.getAttribute('data-state'),
    );
    expect(states).toEqual(['complete', 'current', 'upcoming']);
    expect(screen.getByText(', completed')).toHaveClass('sr-only');
    expect(screen.getByText(', current step')).toBeInTheDocument();
    expect(screen.getByText(', not started')).toBeInTheDocument();
  });

  it('makes only complete steps buttons when onStepSelect is given', () => {
    render(<Steps items={items} current={2} onStepSelect={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Details/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Review/ })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /Submit/ })).not.toBeInTheDocument();
  });

  it('keeps every step read-only without onStepSelect', () => {
    render(<Steps items={items} current={2} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls back with the id and index of a clicked complete step', async () => {
    const onStepSelect = vi.fn();
    render(<Steps items={items} current={2} onStepSelect={onStepSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /Details/ }));
    expect(onStepSelect).toHaveBeenCalledWith('details', 0);
  });

  it('supports keyboard activation of a complete step', async () => {
    const onStepSelect = vi.fn();
    render(<Steps items={items} current={2} onStepSelect={onStepSelect} />);
    await userEvent.tab();
    expect(screen.getByRole('button', { name: /Details/ })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onStepSelect).toHaveBeenCalledWith('details', 0);
  });

  it('does not select a disabled complete step', () => {
    render(
      <Steps
        items={[{ id: 'a', label: 'One', disabled: true }, ...items.slice(1)]}
        current={2}
        onStepSelect={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /One/ })).not.toBeInTheDocument();
  });

  it('shows the step number, or the step icon when it has one, and a check once complete', () => {
    const { container } = render(
      <Steps
        items={[
          { id: 'one', label: 'One', icon: CheckCircleIcon },
          { id: 'two', label: 'Two', icon: CheckCircleIcon },
          { id: 'three', label: 'Three' },
        ]}
        current={1}
      />,
    );
    const chips = container.querySelectorAll('[data-slot="step"]');
    // complete: check icon; current: its own icon; upcoming without icon: number
    expect(chips[0]?.querySelector('svg')).toBeInTheDocument();
    expect(chips[1]?.querySelector('svg')).toBeInTheDocument();
    expect(chips[2]?.querySelector('svg')).not.toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('keeps step numbers Latin and left-to-right', () => {
    renderWithLocale(<Steps items={items} current={0} />, { locale: 'ar' });
    expect(screen.getByText('1')).toHaveAttribute('dir', 'ltr');
  });

  it('scrolls horizontally, hides the scrollbar and respects reduced motion', () => {
    const { container } = render(<Steps items={items} current={1} />);
    expect(container.querySelector('ol')).toHaveClass('overflow-x-auto');
    for (const chip of container.querySelectorAll('[data-slot="step"]')) {
      expect(chip).toHaveClass('motion-reduce:transition-none');
    }
  });

  it('brings the current step into view when it changes', () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
    const { rerender } = render(<Steps items={items} current={0} />);
    rerender(<Steps items={items} current={1} />);
    expect(scroll).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
    expect(scroll.mock.contexts.at(-1)).toBe(screen.getAllByRole('listitem')[1]);
    scroll.mockRestore();
  });

  it('localises the state text and list name in Arabic', async () => {
    const { container } = renderWithLocale(
      <Steps
        items={[
          { id: 'a', label: 'التفاصيل' },
          { id: 'b', label: 'المراجعة' },
          { id: 'c', label: 'الإرسال' },
        ]}
        current={1}
        onStepSelect={vi.fn()}
      />,
      { locale: 'ar' },
    );
    expect(screen.getByRole('list', { name: 'التقدم' })).toBeInTheDocument();
    expect(screen.getByText(', مكتملة')).toBeInTheDocument();
    expect(screen.getByText(', الخطوة الحالية')).toBeInTheDocument();
    expect(screen.getByText(', لم تبدأ')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('has no axe violations', async () => {
    const { container } = render(<Steps items={items} current={1} onStepSelect={vi.fn()} />);
    await expectNoA11yViolations(container);
  });
});

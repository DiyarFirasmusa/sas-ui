import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StatusBar, type StatusBarStage } from '@/components/ui/status-bar';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const stages: StatusBarStage[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'review', label: 'In review' },
  { id: 'approved', label: 'Approved' },
  { id: 'paid', label: 'Paid' },
];
const terminal: StatusBarStage[] = [
  { id: 'rejected', label: 'Rejected' },
  { id: 'cancelled', label: 'Cancelled' },
];

function items() {
  return within(screen.getByRole('list')).getAllByRole('listitem');
}

const mockedLayout: string[] = [];

/** jsdom has no layout; shadow the measurements the scroll effect reads. */
function mockLayout(sizes: Record<string, number>) {
  for (const [property, value] of Object.entries(sizes)) {
    Object.defineProperty(HTMLElement.prototype, property, {
      configurable: true,
      get: () => value,
    });
    mockedLayout.push(property);
  }
}

afterEach(() => {
  for (const property of mockedLayout.splice(0)) {
    Reflect.deleteProperty(HTMLElement.prototype, property);
  }
});

describe('StatusBar', () => {
  it('renders an ordered list of stages inside a labelled landmark', () => {
    render(<StatusBar stages={stages} current="review" />);
    expect(screen.getByRole('navigation', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('list').tagName).toBe('OL');
    expect(items().map((item) => item.textContent)).toEqual([
      'Draft, completed',
      'In review, current stage',
      'Approved, not reached',
      'Paid, not reached',
    ]);
  });

  it('derives complete, current and upcoming states from `current`', () => {
    render(<StatusBar stages={stages} current="approved" />);
    expect(items().map((item) => item.getAttribute('data-state'))).toEqual([
      'complete',
      'complete',
      'current',
      'upcoming',
    ]);
  });

  it('marks only the current stage with aria-current="step"', () => {
    render(<StatusBar stages={stages} current="approved" />);
    const marked = items().filter((item) => item.hasAttribute('aria-current'));
    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveAttribute('aria-current', 'step');
    expect(marked[0]).toHaveTextContent('Approved');
  });

  it('lets explicit states override the derived ones', () => {
    render(
      <StatusBar
        stages={[
          { id: 'a', label: 'A', state: 'complete' },
          { id: 'b', label: 'B', state: 'skipped' },
          { id: 'c', label: 'C', state: 'error' },
          { id: 'd', label: 'D' },
        ]}
        current="c"
      />,
    );
    expect(items().map((item) => item.getAttribute('data-state'))).toEqual([
      'complete',
      'skipped',
      'error',
      'upcoming',
    ]);
    expect(items()[1]).toHaveTextContent('B, skipped');
    expect(items()[2]).toHaveTextContent('C, current stage, error');
    expect(items()[2]).toHaveAttribute('aria-current', 'step');
  });

  it('shows terminal stages after the pipeline, upcoming until one is current', () => {
    render(<StatusBar stages={stages} current="review" terminal={terminal} />);
    expect(items().map((item) => item.getAttribute('data-position'))).toEqual([
      'first',
      'middle',
      'middle',
      'last',
      'terminal',
      'terminal',
    ]);
    expect(
      items()
        .map((item) => item.getAttribute('data-state'))
        .slice(4),
    ).toEqual(['upcoming', 'upcoming']);
  });

  it('shows a current terminal stage as an error segment', () => {
    render(<StatusBar stages={stages} current="rejected" terminal={terminal} />);
    const rejected = items()[4];
    expect(rejected).toHaveAttribute('data-state', 'error');
    expect(rejected).toHaveAttribute('aria-current', 'step');
    expect(rejected).toHaveTextContent('Rejected, current stage, error');
    expect(
      items()
        .slice(0, 4)
        .map((item) => item.getAttribute('data-state')),
    ).toEqual(['upcoming', 'upcoming', 'upcoming', 'upcoming']);
  });

  it('shows Latin step numbers only on request, and not on terminal stages', () => {
    const { rerender } = render(<StatusBar stages={stages} current="review" terminal={terminal} />);
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    rerender(<StatusBar stages={stages} current="review" terminal={terminal} showNumbers />);
    expect(screen.getByText('1')).toHaveAttribute('dir', 'ltr');
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.queryByText('5')).not.toBeInTheDocument();
  });

  it('is not interactive without onStageChange', () => {
    render(<StatusBar stages={stages} current="review" />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});

describe('StatusBar shape', () => {
  it('cuts arrows pointing right in LTR', () => {
    render(<StatusBar stages={stages} current="review" />);
    const [first, middle, , last] = items();
    expect(first?.style.clipPath).toBe(
      'polygon(0 0, calc(100% - 0.75rem) 0, 100% 50%, calc(100% - 0.75rem) 100%, 0 100%)',
    );
    expect(middle?.style.clipPath).toContain('0.75rem 50%');
    expect(last?.style.clipPath).toBe('polygon(0 0, 100% 0, 100% 100%, 0 100%, 0.75rem 50%)');
  });

  it('mirrors the arrows to point left in RTL', () => {
    renderWithLocale(<StatusBar stages={stages} current="review" />, { locale: 'ar' });
    const [first, , , last] = items();
    expect(first?.style.clipPath).toBe(
      'polygon(100% 0, 0.75rem 0, 0 50%, 0.75rem 100%, 100% 100%)',
    );
    expect(last?.style.clipPath).toBe(
      'polygon(100% 0, 0 0, 0 100%, 100% 100%, calc(100% - 0.75rem) 50%)',
    );
  });

  it('scrolls the strip to centre the current stage when it overflows', () => {
    mockLayout({ scrollWidth: 1000, clientWidth: 400, offsetLeft: 450, offsetWidth: 100 });
    render(<StatusBar stages={stages} current="approved" />);
    expect(screen.getByRole('list').scrollLeft).toBe(300);
  });

  it('scrolls on the negative range in RTL', () => {
    mockLayout({ scrollWidth: 1000, clientWidth: 400, offsetLeft: 450, offsetWidth: 100 });
    renderWithLocale(<StatusBar stages={stages} current="approved" />, { locale: 'ar' });
    expect(screen.getByRole('list').scrollLeft).toBe(-300);
  });
});

describe('StatusBar interaction', () => {
  it('makes every stage except the current one a button', () => {
    render(
      <StatusBar stages={stages} current="review" terminal={terminal} onStageChange={() => {}} />,
    );
    const buttons = within(screen.getByRole('list')).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual([
      'Draft, completed',
      'Approved, not reached',
      'Paid, not reached',
      'Rejected, not reached',
      'Cancelled, not reached',
    ]);
  });

  it('calls onStageChange with the stage id', async () => {
    const onStageChange = vi.fn();
    render(<StatusBar stages={stages} current="review" onStageChange={onStageChange} />);
    await userEvent.click(screen.getByRole('button', { name: /^Approved/ }));
    expect(onStageChange).toHaveBeenCalledWith('approved');
    await userEvent.click(screen.getByRole('button', { name: /^Draft/ }));
    expect(onStageChange).toHaveBeenLastCalledWith('draft');
  });

  it('works from the keyboard', async () => {
    const onStageChange = vi.fn();
    render(<StatusBar stages={stages} current="review" onStageChange={onStageChange} />);
    const list = screen.getByRole('list');
    const draft = within(list).getByRole('button', { name: /^Draft/ });
    draft.focus();
    await userEvent.keyboard('{Enter}');
    expect(onStageChange).toHaveBeenCalledWith('draft');
    await userEvent.tab();
    expect(within(list).getByRole('button', { name: /^Approved/ })).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(onStageChange).toHaveBeenLastCalledWith('approved');
  });

  it('does not offer a disabled stage', async () => {
    const onStageChange = vi.fn();
    render(
      <StatusBar
        stages={[...stages.slice(0, 2), { id: 'approved', label: 'Approved', disabled: true }]}
        current="draft"
        onStageChange={onStageChange}
      />,
    );
    const approved = screen.getByRole('button', { name: /^Approved/ });
    expect(approved).toBeDisabled();
    await userEvent.click(approved);
    expect(onStageChange).not.toHaveBeenCalled();
  });

  it('calls onStageChange once confirmChange resolves true', async () => {
    const onStageChange = vi.fn();
    const confirmChange = vi.fn().mockResolvedValue(true);
    render(
      <StatusBar
        stages={stages}
        current="review"
        onStageChange={onStageChange}
        confirmChange={confirmChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /^Approved/ }));
    expect(confirmChange).toHaveBeenCalledWith('approved');
    await waitFor(() => expect(onStageChange).toHaveBeenCalledWith('approved'));
  });

  it('does nothing when confirmChange resolves false', async () => {
    const onStageChange = vi.fn();
    render(
      <StatusBar
        stages={stages}
        current="review"
        onStageChange={onStageChange}
        confirmChange={() => Promise.resolve(false)}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /^Approved/ }));
    await waitFor(() => expect(screen.getByRole('navigation')).not.toHaveAttribute('aria-busy'));
    expect(onStageChange).not.toHaveBeenCalled();
  });

  it('treats a rejected confirmation as a cancel and recovers', async () => {
    const onStageChange = vi.fn();
    render(
      <StatusBar
        stages={stages}
        current="review"
        onStageChange={onStageChange}
        confirmChange={() => Promise.reject(new Error('network'))}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /^Approved/ }));
    await waitFor(() => expect(screen.getByRole('navigation')).not.toHaveAttribute('aria-busy'));
    expect(onStageChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /^Approved/ })).not.toHaveAttribute('aria-busy');
  });

  it('is busy while confirmation is pending and ignores other choices', async () => {
    const onStageChange = vi.fn();
    let settle: (value: boolean) => void = () => {};
    const confirmChange = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          settle = resolve;
        }),
    );
    render(
      <StatusBar
        stages={stages}
        current="review"
        onStageChange={onStageChange}
        confirmChange={confirmChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /^Approved/ }));
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: /^Approved/ })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: /^Approved/ })).toHaveTextContent('updating');
    await userEvent.click(screen.getByRole('button', { name: /^Paid/ }));
    expect(confirmChange).toHaveBeenCalledTimes(1);
    settle(true);
    await waitFor(() => expect(onStageChange).toHaveBeenCalledTimes(1));
    expect(onStageChange).toHaveBeenCalledWith('approved');
    expect(screen.getByRole('navigation')).not.toHaveAttribute('aria-busy');
  });
});

describe('StatusBar on small screens', () => {
  it('shows the current stage as plain text when read-only', () => {
    render(<StatusBar stages={stages} current="approved" />);
    const compact = document.querySelector('[data-slot="status-bar-compact"]');
    expect(compact).toHaveTextContent('Status: Approved');
  });

  it('collapses to a select that lists every stage and changes the stage', async () => {
    const onStageChange = vi.fn();
    render(
      <StatusBar
        stages={stages}
        current="review"
        terminal={terminal}
        onStageChange={onStageChange}
      />,
    );
    const select = screen.getByRole('combobox', { name: 'Status' });
    expect(select).toHaveTextContent('In review');
    await userEvent.click(select);
    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'Draft',
      'In review',
      'Approved',
      'Paid',
      'Rejected',
      'Cancelled',
    ]);
    await userEvent.click(screen.getByRole('option', { name: 'Paid' }));
    expect(onStageChange).toHaveBeenCalledWith('paid');
  });

  it('asks for confirmation from the select too', async () => {
    const onStageChange = vi.fn();
    const confirmChange = vi.fn().mockResolvedValue(false);
    render(
      <StatusBar
        stages={stages}
        current="review"
        onStageChange={onStageChange}
        confirmChange={confirmChange}
      />,
    );
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'Approved' }));
    expect(confirmChange).toHaveBeenCalledWith('approved');
    await waitFor(() => expect(screen.getByRole('navigation')).not.toHaveAttribute('aria-busy'));
    expect(onStageChange).not.toHaveBeenCalled();
  });
});

describe('StatusBar in Arabic', () => {
  const arabic: StatusBarStage[] = [
    { id: 'draft', label: 'مسودة' },
    { id: 'review', label: 'قيد المراجعة' },
    { id: 'approved', label: 'معتمدة' },
  ];

  it('mirrors direction and speaks Arabic', () => {
    renderWithLocale(<StatusBar stages={arabic} current="review" />, { locale: 'ar' });
    const nav = screen.getByRole('navigation', { name: 'الحالة' });
    expect(nav).toHaveAttribute('dir', 'rtl');
    expect(items().map((item) => item.textContent)).toEqual([
      'مسودة, مكتملة',
      'قيد المراجعة, المرحلة الحالية',
      'معتمدة, لم تُبلغ بعد',
    ]);
  });

  it('describes a terminal error in Arabic', () => {
    renderWithLocale(
      <StatusBar
        stages={arabic}
        current="rejected"
        terminal={[{ id: 'rejected', label: 'مرفوضة' }]}
      />,
      { locale: 'ar' },
    );
    expect(items()[3]).toHaveTextContent('مرفوضة, المرحلة الحالية, خطأ');
  });

  it('works from the keyboard and the select in RTL', async () => {
    const onStageChange = vi.fn();
    renderWithLocale(<StatusBar stages={arabic} current="review" onStageChange={onStageChange} />, {
      locale: 'ar',
    });
    await userEvent.click(within(screen.getByRole('list')).getByRole('button', { name: /^مسودة/ }));
    expect(onStageChange).toHaveBeenCalledWith('draft');
    await userEvent.click(screen.getByRole('combobox', { name: 'الحالة' }));
    await userEvent.click(await screen.findByRole('option', { name: 'معتمدة' }));
    expect(onStageChange).toHaveBeenLastCalledWith('approved');
  });

  it('overrides labels', () => {
    render(
      <StatusBar
        stages={stages}
        current="review"
        labels={{ status: 'Workflow', complete: 'done' }}
      />,
    );
    expect(screen.getByRole('navigation', { name: 'Workflow' })).toBeInTheDocument();
    expect(items()[0]).toHaveTextContent('Draft, done');
  });
});

describe('StatusBar accessibility', () => {
  it('has no axe violations in any configuration', async () => {
    const { rerender } = render(<StatusBar stages={stages} current="review" />);
    await expectNoA11yViolations();
    rerender(<StatusBar stages={stages} current="review" terminal={terminal} showNumbers />);
    await expectNoA11yViolations();
    rerender(
      <StatusBar
        stages={stages}
        current="rejected"
        terminal={terminal}
        onStageChange={() => {}}
        confirmChange={() => true}
      />,
    );
    await expectNoA11yViolations();
  });

  it('has no axe violations in Arabic / RTL', async () => {
    renderWithLocale(
      <StatusBar
        stages={[
          { id: 'draft', label: 'مسودة' },
          { id: 'review', label: 'قيد المراجعة' },
        ]}
        current="review"
        terminal={[{ id: 'rejected', label: 'مرفوضة' }]}
        onStageChange={() => {}}
        showNumbers
      />,
      { locale: 'ar' },
    );
    await expectNoA11yViolations();
  });
});

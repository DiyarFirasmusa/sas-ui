import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Approval01 } from '@/components/blocks/approval-01';
import {
  sampleApprovalRequest,
  type ApprovalRequest,
  type ApprovalStage,
} from '@/components/blocks/approval-01-data';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function withDecisions(...decisions: ApprovalStage['decision'][]): ApprovalRequest {
  return {
    ...sampleApprovalRequest,
    stages: sampleApprovalRequest.stages.map((stage, index) => ({
      ...stage,
      decision: decisions[index] ?? 'pending',
    })),
  };
}

function items() {
  return within(screen.getByRole('list', { name: 'Approval stages' })).getAllByRole('listitem');
}

describe('Approval01', () => {
  it('lists every stage with approver, decision, time and comment', () => {
    renderWithLocale(<Approval01 />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Commercial licence renewal' }),
    ).toBeInTheDocument();
    expect(items()).toHaveLength(4);
    const first = items()[0];
    expect(first).toHaveTextContent('Document check');
    expect(first).toHaveTextContent('Omar Al-Jabouri');
    expect(first).toHaveTextContent('Approved');
    expect(first).toHaveTextContent('All documents verified.');
    expect(first?.querySelector('time')).toHaveAttribute('datetime', '2026-11-02T10:12:00Z');
  });

  it('marks the stage that is waiting as the current one', () => {
    renderWithLocale(<Approval01 />);
    const current = items()[2];
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(current).toHaveTextContent('Current stage');
    expect(current).toHaveTextContent('Awaiting decision');
    expect(items().filter((item) => item.hasAttribute('aria-current'))).toHaveLength(1);
  });

  it('shows the overall status in the header', () => {
    renderWithLocale(<Approval01 />);
    const header = screen.getByRole('banner');
    expect(within(header).getByText('In progress')).toBeInTheDocument();
  });

  it('records an approval with its comment', async () => {
    const onDecision = vi.fn();
    renderWithLocale(<Approval01 onDecision={onDecision} />);
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    const dialog = await screen.findByRole('dialog', { name: 'Approve this stage' });
    await userEvent.type(within(dialog).getByRole('textbox'), 'Budget confirmed');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve' }));
    await waitFor(() =>
      expect(onDecision).toHaveBeenCalledWith({
        stageId: 'st-3',
        action: 'approve',
        comment: 'Budget confirmed',
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it.each([
    ['Reject', 'reject', 'Reject this request'],
    ['Return', 'return', 'Return for changes'],
  ] as const)('%s needs a comment before it is sent', async (button, action, title) => {
    const onDecision = vi.fn();
    renderWithLocale(<Approval01 onDecision={onDecision} />);
    await userEvent.click(screen.getByRole('button', { name: button }));
    const dialog = await screen.findByRole('dialog', { name: title });
    await userEvent.click(within(dialog).getByRole('button', { name: button }));
    expect(await within(dialog).findByText('Add a comment to continue')).toBeInTheDocument();
    expect(onDecision).not.toHaveBeenCalled();
    await userEvent.type(within(dialog).getByRole('textbox'), 'Because');
    await userEvent.click(within(dialog).getByRole('button', { name: button }));
    await waitFor(() =>
      expect(onDecision).toHaveBeenCalledWith({ stageId: 'st-3', action, comment: 'Because' }),
    );
  });

  it('sends a decision only once while it is pending', async () => {
    let finish: () => void = () => {};
    const onDecision = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderWithLocale(<Approval01 onDecision={onDecision} requireComment={[]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    const dialog = await screen.findByRole('dialog');
    const submit = within(dialog).getByRole('button', { name: 'Approve' });
    await userEvent.click(submit);
    await userEvent.click(submit);
    expect(onDecision).toHaveBeenCalledOnce();
    finish();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('keeps the dialog open when the decision fails', async () => {
    const onDecision = vi.fn().mockRejectedValue(new Error('Already decided by someone else'));
    renderWithLocale(<Approval01 onDecision={onDecision} requireComment={[]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve' }));
    expect(await within(dialog).findByText('Already decided by someone else')).toBeInTheDocument();
  });

  it('hides the actions from someone who cannot decide', () => {
    renderWithLocale(<Approval01 canAct={false} />);
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
    expect(screen.getByText('You are not an approver for the current stage.')).toBeInTheDocument();
  });

  it.each([
    ['approved', ['approved', 'approved', 'approved', 'approved'], 'This request was approved.'],
    ['rejected', ['approved', 'rejected'], 'This request was rejected.'],
    ['returned', ['approved', 'returned'], 'returned to the requester'],
  ] as const)('shows a closed %s request without actions', (_name, decisions, note) => {
    renderWithLocale(
      <Approval01 state={{ status: 'success', data: withDecisions(...decisions) }} />,
    );
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
    expect(screen.getByText(note, { exact: false })).toBeInTheDocument();
    expect(items().some((item) => item.hasAttribute('aria-current'))).toBe(false);
  });

  it('shows a skeleton while loading', () => {
    renderWithLocale(<Approval01 state={{ status: 'loading' }} />);
    expect(screen.getByRole('status', { name: 'Loading approval workflow' })).toBeInTheDocument();
  });

  it('shows the error with a retry', async () => {
    const onRetry = vi.fn();
    renderWithLocale(
      <Approval01 state={{ status: 'error', message: 'Timeout' }} onRetry={onRetry} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Timeout');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows an empty state when no workflow is configured', () => {
    renderWithLocale(
      <Approval01 state={{ status: 'success', data: { ...sampleApprovalRequest, stages: [] } }} />,
    );
    expect(screen.getByRole('heading', { name: 'No approval stages' })).toBeInTheDocument();
  });

  it('renders Arabic with Arabic names and Latin digits in the dates', () => {
    renderWithLocale(<Approval01 />, { locale: 'ar' });
    expect(
      screen.getByRole('heading', { level: 1, name: 'تجديد ترخيص تجاري' }),
    ).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'مراحل الموافقة' });
    const first = within(list).getAllByRole('listitem')[0];
    expect(first).toHaveTextContent('عمر الجبوري');
    expect(first).toHaveTextContent('تمت الموافقة');
    expect(first?.querySelector('time')?.textContent ?? '').not.toMatch(/[٠-٩]/);
    expect(screen.getByRole('button', { name: 'موافقة' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(<Approval01 />);
    await expectNoA11yViolations(container);
  });

  it('has no axe violations in Arabic, closed, loading and failed states', async () => {
    const arabic = renderWithLocale(<Approval01 />, { locale: 'ar' });
    await expectNoA11yViolations(arabic.container);
    arabic.unmount();
    const closed = renderWithLocale(
      <Approval01 state={{ status: 'success', data: withDecisions('approved', 'rejected') }} />,
    );
    await expectNoA11yViolations(closed.container);
    closed.unmount();
    const loading = renderWithLocale(<Approval01 state={{ status: 'loading' }} />);
    await expectNoA11yViolations(loading.container);
    loading.unmount();
    const failed = renderWithLocale(<Approval01 state={{ status: 'error' }} onRetry={() => {}} />);
    await expectNoA11yViolations(failed.container);
  });
});

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ApprovalAction } from '@/components/blocks/approval-01-data';
import { DecisionDialog } from '@/components/blocks/approval-01-dialog';
import { messages } from '@/components/blocks/approval-01-messages';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function setup(
  props: {
    action?: ApprovalAction | null;
    requireComment?: readonly ApprovalAction[];
    onSubmit?: (action: ApprovalAction, comment: string) => void | Promise<void>;
    onClose?: () => void;
    language?: 'en' | 'ar';
  } = {},
) {
  const {
    action = 'reject',
    requireComment = ['approve', 'reject', 'return'],
    onSubmit = vi.fn(),
    onClose = vi.fn(),
    language = 'en',
  } = props;
  renderWithLocale(
    <DecisionDialog
      action={action}
      labels={messages[language]}
      stageName="Finance approval"
      requireComment={requireComment}
      onSubmit={onSubmit}
      onClose={onClose}
    />,
    { locale: language },
  );
  return { onSubmit, onClose };
}

describe('DecisionDialog', () => {
  it('stays closed without an action', () => {
    setup({ action: null });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens with the action copy and the stage name', async () => {
    setup({ action: 'return' });
    const dialog = await screen.findByRole('dialog', { name: 'Return for changes' });
    expect(within(dialog).getByText('Stage: Finance approval')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Return' })).toBeInTheDocument();
  });

  it('refuses to submit without a comment and says why', async () => {
    const { onSubmit } = setup();
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));
    expect(await within(dialog).findByText('Add a comment to continue')).toBeInTheDocument();
    expect(within(dialog).getByRole('textbox', { name: /Comment/ })).toBeInvalid();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('treats a whitespace-only comment as missing', async () => {
    const { onSubmit } = setup();
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByRole('textbox', { name: /Comment/ }), '   ');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the trimmed comment and closes', async () => {
    const { onSubmit, onClose } = setup();
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: /Comment/ }),
      '  Budget exceeded  ',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('reject', 'Budget exceeded'));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  it('lets an optional action go through without a comment', async () => {
    const { onSubmit } = setup({ action: 'approve', requireComment: ['reject'] });
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Optional')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('approve', ''));
  });

  it('is single-flight while the decision is being saved', async () => {
    let finish: () => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { onClose } = setup({ onSubmit });
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByRole('textbox', { name: /Comment/ }), 'No');
    const submit = within(dialog).getByRole('button', { name: 'Reject' });
    await userEvent.click(submit);
    await waitFor(() => expect(submit).toHaveAttribute('aria-busy', 'true'));
    await userEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    finish();
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  it('stays open with the error and the typed comment when saving fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Conflict: already decided'));
    const { onClose } = setup({ onSubmit });
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByRole('textbox', { name: /Comment/ }), 'Reason');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));
    expect(await within(dialog).findByText('Conflict: already decided')).toBeInTheDocument();
    expect(within(dialog).getByRole('textbox', { name: /Comment/ })).toHaveValue('Reason');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes from Cancel', async () => {
    const { onClose } = setup();
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('renders Arabic copy and has no axe violations', async () => {
    setup({ action: 'approve', language: 'ar' });
    const dialog = await screen.findByRole('dialog', { name: 'الموافقة على هذه المرحلة' });
    expect(within(dialog).getByText('المرحلة: Finance approval')).toBeInTheDocument();
    await expectNoA11yViolations(dialog);
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

/** A promise the test settles by hand. */
function deferred() {
  let resolve: () => void = () => {};
  let reject: (reason: Error) => void = () => {};
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

describe('ConfirmDialog', () => {
  it('shows the title, description and default labels', async () => {
    render(
      <ConfirmDialog
        open
        title="Delete invoice?"
        description="This cannot be undone."
        onConfirm={() => {}}
      />,
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Delete invoice?',
    });
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('opens from its trigger and closes after a synchronous confirm', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        trigger={<button type="button">Open</button>}
        title="Sure?"
        onConfirm={onConfirm}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('cancels without confirming', async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(<ConfirmDialog open onOpenChange={onOpenChange} title="Sure?" onConfirm={onConfirm} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it('uses custom labels and the destructive tone', async () => {
    render(
      <ConfirmDialog
        open
        destructive
        title="Delete?"
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={() => {}}
      />,
    );
    expect(await screen.findByRole('button', { name: 'Delete' })).toHaveClass('bg-danger');
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
  });

  it('starts focus on Cancel for destructive confirmations', async () => {
    render(<ConfirmDialog open destructive title="Delete?" onConfirm={() => {}} />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    });
  });

  describe('single flight', () => {
    it('runs onConfirm once however many times confirm is pressed', async () => {
      const pending = deferred();
      const onConfirm = vi.fn(() => pending.promise);
      render(<ConfirmDialog open title="Pay?" onConfirm={onConfirm} />);
      const confirm = await screen.findByRole('button', { name: 'Confirm' });
      await userEvent.click(confirm);
      await userEvent.click(confirm);
      await userEvent.keyboard('{Enter}');
      expect(onConfirm).toHaveBeenCalledTimes(1);
      pending.resolve();
      await waitFor(() => {
        expect(confirm).not.toHaveAttribute('aria-busy');
      });
    });

    it('shows loading, blocks Cancel and Escape, and stays open until it resolves', async () => {
      const pending = deferred();
      const onOpenChange = vi.fn();
      render(
        <ConfirmDialog
          open
          onOpenChange={onOpenChange}
          title="Pay?"
          onConfirm={() => pending.promise}
        />,
      );
      const confirm = await screen.findByRole('button', { name: 'Confirm' });
      await userEvent.click(confirm);
      expect(confirm).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

      await userEvent.keyboard('{Escape}');
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      pending.resolve();
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
      });
    });

    it('stays open after a rejection, shows the error and lets the user retry', async () => {
      const onOpenChange = vi.fn();
      const onConfirm = vi
        .fn<() => Promise<void>>()
        .mockRejectedValueOnce(new Error('Card declined'))
        .mockResolvedValueOnce(undefined);
      render(<ConfirmDialog open onOpenChange={onOpenChange} title="Pay?" onConfirm={onConfirm} />);
      await userEvent.click(await screen.findByRole('button', { name: 'Confirm' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Card declined');
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Confirm' })).not.toHaveAttribute('aria-busy');

      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      expect(onConfirm).toHaveBeenCalledTimes(2);
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
      });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('surfaces the error prop instead of the rejection message', async () => {
      const onConfirm = vi.fn().mockRejectedValue(new Error('raw 500'));
      render(
        <ConfirmDialog
          open
          title="Pay?"
          error="Payment failed, try another card."
          onConfirm={onConfirm}
        />,
      );
      await userEvent.click(await screen.findByRole('button', { name: 'Confirm' }));
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Payment failed, try another card.',
      );
    });

    it('falls back to a localized message for non-Error rejections', async () => {
      const onConfirm = vi.fn().mockRejectedValue('nope');
      renderWithLocale(<ConfirmDialog open title="هل أنت متأكد؟" onConfirm={onConfirm} />, {
        locale: 'ar',
      });
      await userEvent.click(await screen.findByRole('button', { name: 'تأكيد' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('حدث خطأ ما. حاول مرة أخرى.');
    });
  });

  it('uses Arabic labels', async () => {
    renderWithLocale(<ConfirmDialog open title="حذف الفاتورة؟" onConfirm={() => {}} />, {
      locale: 'ar',
    });
    expect(await screen.findByRole('button', { name: 'تأكيد' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'إلغاء' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    render(
      <ConfirmDialog
        open
        destructive
        title="Delete?"
        description="Gone for good."
        onConfirm={() => {}}
      />,
    );
    await screen.findByRole('dialog');
    await expectNoA11yViolations();
  });
});

describe('ConfirmDialog look', () => {
  it('puts the confirm action first and uses the 420px dialog', async () => {
    renderWithLocale(<ConfirmDialog open title="Delete trip" onConfirm={() => {}} />);
    const dialog = await screen.findByRole('dialog', { name: 'Delete trip' });
    expect(dialog).toHaveClass('max-w-[26.25rem]');
    const buttons = screen.getAllByRole('button').map((button) => button.textContent);
    expect(buttons).toEqual(['Confirm', 'Cancel']);
  });

  it('draws an optional glyph in the danger tone for destructive confirmations', async () => {
    renderWithLocale(
      <ConfirmDialog open destructive icon={<svg />} title="Delete trip" onConfirm={() => {}} />,
    );
    await screen.findByRole('dialog');
    expect(document.querySelector('[data-slot="dialog-icon"]')).toHaveAttribute(
      'data-tone',
      'danger',
    );
  });

  it('has no corner close button, as the footer already cancels', async () => {
    renderWithLocale(<ConfirmDialog open title="Delete trip" onConfirm={() => {}} />);
    await screen.findByRole('dialog');
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });
});

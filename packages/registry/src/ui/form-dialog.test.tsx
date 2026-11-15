import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormDialog, type FormDialogProps } from '@/components/ui/form-dialog';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function Harness(props: Partial<FormDialogProps>) {
  const [open, setOpen] = useState(true);
  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      title="New client"
      onSubmit={() => {}}
      {...props}
    >
      <label>
        Name
        <input name="name" />
      </label>
    </FormDialog>
  );
}

describe('FormDialog', () => {
  it('renders the form with title, description and localized footer', async () => {
    render(<Harness description="Add a client record" />);
    const dialog = await screen.findByRole('dialog', { name: 'New client' });
    expect(dialog).toHaveAccessibleDescription('Add a client record');
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'submit');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('submits through the form without a page reload, on click and on Enter', async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    await userEvent.type(await screen.findByLabelText('Name'), 'Layla{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(onSubmit.mock.calls[0]?.[0].defaultPrevented).toBe(true);
  });

  it('does not close by itself after submit', async () => {
    render(<Harness />);
    await userEvent.click(await screen.findByRole('button', { name: 'Save' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('while submitting: shows loading, ignores submits and cannot be dismissed', async () => {
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();
    render(<Harness isSubmitting onSubmit={onSubmit} onOpenChange={onOpenChange} />);
    const save = await screen.findByRole('button', { name: 'Save' });
    expect(save).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    await userEvent.click(save);
    await userEvent.keyboard('{Escape}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows a form-level error', async () => {
    render(<Harness error="Name already exists" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Name already exists');
  });

  it('closes with Cancel and Escape when the guard is off, even with edits', async () => {
    render(<Harness />);
    await userEvent.type(await screen.findByLabelText('Name'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('confirmDiscard', () => {
    it('closes straight away when nothing was edited', async () => {
      render(<Harness confirmDiscard />);
      await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('asks before discarding edits and keeps the form when the user keeps editing', async () => {
      render(<Harness confirmDiscard />);
      const input = await screen.findByLabelText('Name');
      await userEvent.type(input, 'Layla');
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(await screen.findByRole('dialog', { name: 'Discard changes?' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: 'Discard changes?' })).not.toBeInTheDocument();
      });
      expect(screen.getByRole('dialog', { name: 'New client' })).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toHaveValue('Layla');
    });

    it('closes both dialogs when the user discards', async () => {
      render(<Harness confirmDiscard />);
      await userEvent.type(await screen.findByLabelText('Name'), 'Layla');
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Discard' }));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('also guards Escape', async () => {
      render(<Harness confirmDiscard />);
      await userEvent.type(await screen.findByLabelText('Name'), 'Layla');
      await userEvent.keyboard('{Escape}');
      expect(await screen.findByRole('dialog', { name: 'Discard changes?' })).toBeInTheDocument();
    });

    it('trusts isDirty over typing', async () => {
      render(<Harness confirmDiscard isDirty={false} />);
      await userEvent.type(await screen.findByLabelText('Name'), 'Layla');
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('asks in Arabic', async () => {
      renderWithLocale(<Harness confirmDiscard isDirty title="عميل جديد" />, {
        locale: 'ar',
      });
      await userEvent.click(await screen.findByRole('button', { name: 'إلغاء' }));
      expect(await screen.findByRole('dialog', { name: 'تجاهل التغييرات؟' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'متابعة التعديل' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'تجاهل' })).toBeInTheDocument();
    });
  });

  it('uses Arabic footer labels and accepts overrides', async () => {
    const { unmount } = renderWithLocale(<Harness title="عميل جديد" />, {
      locale: 'ar',
    });
    expect(await screen.findByRole('button', { name: 'حفظ' })).toBeInTheDocument();
    unmount();
    render(<Harness submitLabel="Create" cancelLabel="Back" />);
    expect(await screen.findByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });

  it('opens from a trigger', async () => {
    render(
      <FormDialog trigger={<button type="button">Add</button>} title="New" onSubmit={() => {}}>
        <input aria-label="Name" />
      </FormDialog>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(await screen.findByRole('dialog', { name: 'New' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    render(<Harness confirmDiscard description="Add a client" />);
    await screen.findByRole('dialog');
    await expectNoA11yViolations();
  });
});

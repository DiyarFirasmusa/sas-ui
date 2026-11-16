import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FormPage01 } from '@/components/blocks/form-page-01';
import type { FormPage01Values } from '@/components/blocks/form-page-01-model';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const valid: Partial<FormPage01Values> = {
  fullName: 'Layla Hassan',
  nationalId: '123456789012',
  email: 'layla@example.com',
  phone: '+964 770 123 4567',
  governorate: 'baghdad',
  addressLine: 'Karrada, street 52',
  birthDate: '1992-04-12',
  startDate: '2025-01-01',
  endDate: '',
};

function unsavedNote(): HTMLElement {
  const bar = document.querySelector<HTMLElement>('[data-slot="form-page-actions"]');
  const note = bar?.querySelector<HTMLElement>('[role="status"]');
  if (!note) {
    throw new Error('unsaved note not found');
  }
  return note;
}

describe('FormPage01', () => {
  it('shows required errors and does not submit an empty form', async () => {
    const onSubmit = vi.fn();
    renderWithLocale(<FormPage01 onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Enter the full name')).toBeInTheDocument();
    expect(screen.getByText('Enter exactly 12 digits')).toBeInTheDocument();
    expect(screen.getByText('Enter an email address')).toBeInTheDocument();
    expect(screen.getByText('Use the format +964 7XX XXX XXXX')).toBeInTheDocument();
    expect(screen.getByText('Choose a governorate')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the typed values', async () => {
    const onSubmit = vi.fn();
    renderWithLocale(<FormPage01 onSubmit={onSubmit} defaultValues={valid} />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      fullName: 'Layla Hassan',
      phone: '+964 770 123 4567',
      governorate: 'baghdad',
    });
    expect(await screen.findByText('Submitted for review.')).toBeInTheDocument();
  });

  it('keeps the phone left-to-right and validates its format', async () => {
    renderWithLocale(<FormPage01 defaultValues={valid} />);
    const phone = screen.getByLabelText(/Mobile phone/);
    expect(phone).toHaveAttribute('dir', 'ltr');
    await userEvent.clear(phone);
    await userEvent.type(phone, '0770');
    await userEvent.tab();
    expect(await screen.findByText('Use the format +964 7XX XXX XXXX')).toBeInTheDocument();
  });

  it('is single-flight while the submit is pending', async () => {
    let finish: () => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderWithLocale(<FormPage01 onSubmit={onSubmit} defaultValues={valid} />);
    const button = screen.getByRole('button', { name: 'Submit' });
    await userEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute('aria-busy', 'true'));
    await userEvent.click(button);
    expect(onSubmit).toHaveBeenCalledOnce();
    finish();
    await waitFor(() => expect(button).not.toHaveAttribute('aria-busy'));
  });

  it('maps a backend validation payload onto the field and the form', async () => {
    const onSubmit = vi.fn(() =>
      Promise.reject({ errors: { email: ['Already registered'] }, message: 'Check the form' }),
    );
    renderWithLocale(<FormPage01 onSubmit={onSubmit} defaultValues={valid} />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Already registered')).toBeInTheDocument();
    expect(screen.getByText('Check the form')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows a generic message when the server fails without details', async () => {
    renderWithLocale(
      <FormPage01 onSubmit={() => Promise.reject(new Error(''))} defaultValues={valid} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('We could not submit the form. Try again.')).toBeInTheDocument();
  });

  it('the demo server refuses the known email on the email field', async () => {
    renderWithLocale(<FormPage01 defaultValues={{ ...valid, email: 'taken@example.com' }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(
      await screen.findByText('This email is already registered to another employee.'),
    ).toBeInTheDocument();
  });

  it('saves a draft without validating and clears the unsaved note', async () => {
    const onSaveDraft = vi.fn();
    renderWithLocale(<FormPage01 onSaveDraft={onSaveDraft} />);
    await userEvent.type(screen.getByLabelText(/Full name/), 'Layla');
    expect(unsavedNote()).toHaveTextContent('You have unsaved changes');
    await userEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(onSaveDraft).toHaveBeenCalledOnce());
    expect(onSaveDraft.mock.calls[0]?.[0]).toMatchObject({ fullName: 'Layla', email: '' });
    expect(await screen.findByText('Draft saved.')).toBeInTheDocument();
    expect(unsavedNote()).toBeEmptyDOMElement();
  });

  it('reports a failed draft', async () => {
    renderWithLocale(<FormPage01 onSaveDraft={() => Promise.reject(new Error('down'))} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(await screen.findByText('We could not save the draft. Try again.')).toBeInTheDocument();
  });

  it('leaves at once when nothing changed', async () => {
    const onCancel = vi.fn();
    renderWithLocale(<FormPage01 onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('asks before discarding unsaved changes', async () => {
    const onCancel = vi.fn();
    renderWithLocale(<FormPage01 onCancel={onCancel} />);
    await userEvent.type(screen.getByLabelText(/Full name/), 'Layla');
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(
      await screen.findByRole('dialog', { name: 'Discard your changes?' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Full name/)).toHaveValue('Layla');

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Discard changes' }));
    await waitFor(() => expect(onCancel).toHaveBeenCalledOnce());
  });

  it('warns the browser before the tab closes while dirty', async () => {
    renderWithLocale(<FormPage01 />);
    const clean = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);
    await userEvent.type(screen.getByLabelText(/Full name/), 'L');
    const dirty = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirty);
    expect(dirty.defaultPrevented).toBe(true);
  });

  it('renders Arabic labels and Arabic governorates', () => {
    renderWithLocale(<FormPage01 />, { locale: 'ar' });
    expect(screen.getByRole('heading', { level: 1, name: 'موظف جديد' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'الهوية' })).toBeInTheDocument();
    expect(screen.getByLabelText(/رقم الهاتف المحمول/)).toHaveAttribute('dir', 'ltr');
    expect(screen.getByRole('button', { name: 'حفظ كمسودة' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(<FormPage01 defaultValues={valid} />);
    await expectNoA11yViolations(container);
  });
});

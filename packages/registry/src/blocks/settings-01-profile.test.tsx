import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Settings01Profile } from '@/components/blocks/settings-01-profile';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('Settings01Profile', () => {
  it('starts with the sample profile and a disabled Save', () => {
    renderWithLocale(<Settings01Profile />);
    expect(screen.getByLabelText(/Display name/)).toHaveValue('Layla Hassan');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    expect(screen.getByRole('img', { name: 'Layla Hassan' })).toBeInTheDocument();
  });

  it('validates before saving', async () => {
    const onSave = vi.fn();
    renderWithLocale(<Settings01Profile onSave={onSave} />);
    await userEvent.clear(screen.getByLabelText(/Display name/));
    await userEvent.clear(screen.getByLabelText(/Mobile phone/));
    await userEvent.type(screen.getByLabelText(/Mobile phone/), '0770');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Enter your name')).toBeInTheDocument();
    expect(screen.getByText('Use the format +964 7XX XXX XXXX')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves the edited values and confirms', async () => {
    const onSave = vi.fn();
    renderWithLocale(<Settings01Profile onSave={onSave} />);
    const name = screen.getByLabelText(/Display name/);
    await userEvent.clear(name);
    await userEvent.type(name, 'Layla H.');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({ displayName: 'Layla H.' });
    expect(await screen.findByText('Profile saved.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('puts a server field error on the field and resets edits', async () => {
    renderWithLocale(
      <Settings01Profile onSave={() => Promise.reject({ email: ['Already in use'] })} />,
    );
    const email = screen.getByLabelText(/Email/);
    await userEvent.clear(email);
    await userEvent.type(email, 'new@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Already in use')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText(/Email/)).toHaveValue('layla@example.com');
  });

  it('shows the Arabic sample profile with a left-to-right phone', () => {
    renderWithLocale(<Settings01Profile />, { locale: 'ar' });
    expect(screen.getByLabelText(/الاسم المعروض/)).toHaveValue('ليلى حسن');
    expect(screen.getByLabelText(/رقم الهاتف المحمول/)).toHaveAttribute('dir', 'ltr');
    expect(screen.getByRole('heading', { name: 'الملف الشخصي' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(<Settings01Profile />);
    await expectNoA11yViolations(container);
  });
});

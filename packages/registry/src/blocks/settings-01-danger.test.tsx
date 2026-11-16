import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Settings01Danger } from '@/components/blocks/settings-01-danger';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('Settings01Danger', () => {
  it('asks before deleting and does nothing on cancel', async () => {
    const onDeleteAccount = vi.fn();
    renderWithLocale(<Settings01Danger onDeleteAccount={onDeleteAccount} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));
    const dialog = await screen
      .findByRole('alertdialog', { name: 'Delete your account?' })
      .catch(() => screen.findByRole('dialog', { name: 'Delete your account?' }));
    expect(dialog).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onDeleteAccount).not.toHaveBeenCalled();
  });

  it('deletes after confirming', async () => {
    const onDeleteAccount = vi.fn();
    renderWithLocale(<Settings01Danger onDeleteAccount={onDeleteAccount} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete permanently' }));
    await waitFor(() => expect(onDeleteAccount).toHaveBeenCalledOnce());
  });

  it('keeps the dialog open with the error when deleting fails', async () => {
    renderWithLocale(
      <Settings01Danger onDeleteAccount={() => Promise.reject(new Error('Account is locked'))} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete permanently' }));
    expect(await screen.findByText('Account is locked')).toBeInTheDocument();
  });

  it('signs out everywhere after confirming', async () => {
    const onSignOutEverywhere = vi.fn();
    renderWithLocale(<Settings01Danger onSignOutEverywhere={onSignOutEverywhere} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sign out everywhere' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(onSignOutEverywhere).toHaveBeenCalledOnce());
  });

  it('renders Arabic wording', () => {
    renderWithLocale(<Settings01Danger />, { locale: 'ar' });
    expect(screen.getByRole('heading', { name: 'المنطقة الخطرة' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'حذف الحساب' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(<Settings01Danger />);
    await expectNoA11yViolations(container);
  });
});

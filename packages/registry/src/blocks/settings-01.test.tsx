import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Settings01 } from '@/components/blocks/settings-01';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('Settings01', () => {
  it('lists the four sections and opens Profile first', () => {
    renderWithLocale(<Settings01 />);
    const nav = screen.getByRole('tablist', { name: 'Settings sections' });
    expect(
      within(nav)
        .getAllByRole('tab')
        .map((tab) => tab.textContent),
    ).toEqual(['Profile', 'Preferences', 'Notifications', 'Danger zone']);
    expect(screen.getByRole('tab', { name: 'Profile' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText(/Display name/)).toBeVisible();
  });

  it('switches sections and keeps unsaved edits of the one left behind', async () => {
    renderWithLocale(<Settings01 />);
    const name = screen.getByLabelText(/Display name/);
    await userEvent.clear(name);
    await userEvent.type(name, 'Layla H.');
    await userEvent.click(screen.getByRole('tab', { name: 'Notifications' }));
    expect(await screen.findByRole('switch', { name: /Security alerts/ })).toBeVisible();
    await userEvent.click(screen.getByRole('tab', { name: 'Profile' }));
    expect(screen.getByLabelText(/Display name/)).toHaveValue('Layla H.');
  });

  it('wires every section handler', async () => {
    const onSaveProfile = vi.fn();
    const onPreferencesChange = vi.fn();
    const onSaveNotifications = vi.fn();
    const onDeleteAccount = vi.fn();
    renderWithLocale(
      <Settings01
        onSaveProfile={onSaveProfile}
        onPreferencesChange={onPreferencesChange}
        onSaveNotifications={onSaveNotifications}
        onDeleteAccount={onDeleteAccount}
      />,
    );
    await userEvent.type(screen.getByLabelText(/Job title/), ' II');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Profile saved.');
    expect(onSaveProfile).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByRole('tab', { name: 'Preferences' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Light' }));
    expect(onPreferencesChange).toHaveBeenCalledWith({
      language: 'en',
      preset: 'neutral',
      mode: 'light',
    });

    await userEvent.click(screen.getByRole('tab', { name: 'Notifications' }));
    await userEvent.click(await screen.findByRole('switch', { name: /Product updates/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
    await screen.findByText('Notification preferences saved.');
    expect(onSaveNotifications).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByRole('tab', { name: 'Danger zone' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete account' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete permanently' }));
    await vi.waitFor(() => expect(onDeleteAccount).toHaveBeenCalledOnce());
  });

  it('can open on another section', () => {
    renderWithLocale(<Settings01 defaultSection="danger" />);
    expect(screen.getByRole('tab', { name: 'Danger zone' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('renders Arabic wording and mirrors arrow-key navigation between sections', async () => {
    renderWithLocale(<Settings01 />, { locale: 'ar' });
    expect(screen.getByRole('heading', { level: 1, name: 'الإعدادات' })).toBeInTheDocument();
    const first = screen.getByRole('tab', { name: 'الملف الشخصي' });
    first.focus();
    // The test environment has no wide viewport, so tabs are horizontal: in RTL the
    // end-side neighbour is reached with ArrowLeft.
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'التفضيلات' })).toHaveFocus();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(<Settings01 />);
    await expectNoA11yViolations(container);
  });
});

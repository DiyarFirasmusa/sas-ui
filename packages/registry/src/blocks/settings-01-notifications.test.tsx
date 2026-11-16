import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Settings01Notifications } from '@/components/blocks/settings-01-notifications';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('Settings01Notifications', () => {
  it('shows each switch with its description and the saved state', () => {
    renderWithLocale(<Settings01Notifications />);
    expect(screen.getByRole('switch', { name: /Security alerts/ })).toBeChecked();
    expect(screen.getByRole('switch', { name: /Product updates/ })).not.toBeChecked();
    expect(
      screen.getByText('A Sunday email with what happened in your projects.'),
    ).toBeInTheDocument();
  });

  it('enables Save only after a change and saves every switch', async () => {
    const onSave = vi.fn();
    renderWithLocale(<Settings01Notifications onSave={onSave} />);
    const save = screen.getByRole('button', { name: 'Save preferences' });
    expect(save).toBeDisabled();
    await userEvent.click(screen.getByRole('switch', { name: /Product updates/ }));
    await userEvent.click(save);
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave.mock.calls[0]?.[0]).toEqual({
      security: true,
      mentions: true,
      product: true,
      digest: true,
    });
    expect(await screen.findByText('Notification preferences saved.')).toBeInTheDocument();
  });

  it('reports a failed save and keeps the choice', async () => {
    renderWithLocale(<Settings01Notifications onSave={() => Promise.reject(new Error('down'))} />);
    await userEvent.click(screen.getByRole('switch', { name: /Weekly summary/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
    expect(
      await screen.findByText('We could not save your preferences. Try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /Weekly summary/ })).not.toBeChecked();
  });

  it('renders Arabic wording', () => {
    renderWithLocale(<Settings01Notifications />, { locale: 'ar' });
    expect(screen.getByRole('switch', { name: /تنبيهات الأمان/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'الإشعارات' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(<Settings01Notifications />);
    await expectNoA11yViolations(container);
  });
});

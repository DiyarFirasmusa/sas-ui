import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Settings01PreferencesSection } from '@/components/blocks/settings-01-preferences';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('Settings01PreferencesSection', () => {
  it('shows the current choices as pressed segments', () => {
    renderWithLocale(<Settings01PreferencesSection />);
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Neutral' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('reports the full next choices without a ThemeProvider', async () => {
    const onChange = vi.fn();
    renderWithLocale(<Settings01PreferencesSection onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Dark' }));
    expect(onChange).toHaveBeenLastCalledWith({ language: 'en', preset: 'neutral', mode: 'dark' });
    await userEvent.click(screen.getByRole('button', { name: 'HR' }));
    expect(onChange).toHaveBeenLastCalledWith({ language: 'en', preset: 'hr', mode: 'dark' });
    await userEvent.click(screen.getByRole('button', { name: 'العربية' }));
    expect(onChange).toHaveBeenLastCalledWith({ language: 'ar', preset: 'hr', mode: 'dark' });
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps one choice selected when the active segment is pressed again', async () => {
    renderWithLocale(<Settings01PreferencesSection />);
    await userEvent.click(screen.getByRole('button', { name: 'System' }));
    expect(screen.getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('follows a controlled value and hides the theme choice without presets', () => {
    renderWithLocale(
      <Settings01PreferencesSection
        value={{ language: 'ar', preset: 'hr', mode: 'light' }}
        presets={[]}
      />,
    );
    expect(screen.getByRole('button', { name: 'العربية' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('group', { name: 'Theme' })).not.toBeInTheDocument();
  });

  it('renders Arabic wording', () => {
    renderWithLocale(<Settings01PreferencesSection />, { locale: 'ar' });
    expect(screen.getByRole('button', { name: 'داكن' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'التفضيلات' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(<Settings01PreferencesSection />);
    await expectNoA11yViolations(container);
  });
});

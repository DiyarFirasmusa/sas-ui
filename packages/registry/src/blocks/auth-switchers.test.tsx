import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthSwitchers } from '@/components/blocks/auth-switchers';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function switchers(locale: 'en' | 'ar' = 'en') {
  const onLocaleChange = vi.fn();
  const onModeChange = vi.fn();
  renderWithLocale(
    <AuthSwitchers
      locale={locale}
      onLocaleChange={onLocaleChange}
      mode="light"
      onModeChange={onModeChange}
    />,
    { locale },
  );
  return { onLocaleChange, onModeChange };
}

describe('AuthSwitchers', () => {
  it('shows pill groups for language and theme with the current choices pressed', () => {
    switchers();
    const language = screen.getByRole('group', { name: 'Language' });
    expect(language).toHaveClass('rounded-pill', 'border-stroke', 'bg-secondary');
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'English' })).toHaveClass('bg-primary');
    expect(screen.getByRole('button', { name: 'العربية' })).toHaveAttribute('lang', 'ar');
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the language and the theme the user picks', async () => {
    const { onLocaleChange, onModeChange } = switchers();
    await userEvent.click(screen.getByRole('button', { name: 'العربية' }));
    expect(onLocaleChange).toHaveBeenCalledWith('ar');
    await userEvent.click(screen.getByRole('button', { name: 'Dark' }));
    expect(onModeChange).toHaveBeenCalledWith('dark');
  });

  it('is labelled in Arabic', () => {
    switchers('ar');
    expect(screen.getByRole('group', { name: 'اللغة' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'المظهر' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'العربية' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('has no axe violations', async () => {
    switchers();
    await expectNoA11yViolations();
  });
});

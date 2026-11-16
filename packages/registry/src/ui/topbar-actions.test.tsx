import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TopbarContext, type TopbarVariant } from '@/components/ui/topbar';
import { TopbarLanguageMenu, TopbarThemeSwitch } from '@/components/ui/topbar-actions';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function inBar(variant: TopbarVariant, children: ReactNode, locale: 'en' | 'ar' = 'en') {
  return renderWithLocale(<TopbarContext value={variant}>{children}</TopbarContext>, { locale });
}

describe('TopbarThemeSwitch', () => {
  it('is a left-to-right pair of icon buttons with the current mode pressed', async () => {
    const onModeChange = vi.fn();
    inBar('sidebar', <TopbarThemeSwitch mode="light" onModeChange={onModeChange} />);
    const group = screen.getByRole('group', { name: 'Theme' });
    expect(group).toHaveAttribute('dir', 'ltr');
    expect(group).toHaveClass('h-9.5', 'rounded-xl', 'border-sidebar-border');
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Light' })).toHaveClass('bg-primary-container');
    await userEvent.click(screen.getByRole('button', { name: 'Dark' }));
    expect(onModeChange).toHaveBeenCalledWith('dark');
  });

  it('resolves the system mode through the OS preference', () => {
    inBar('surface', <TopbarThemeSwitch mode="system" onModeChange={() => {}} />);
    // The jsdom stub reports no dark preference, so system reads as light.
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows labels in a bordered 36px segment in the hr bar', () => {
    inBar('hr', <TopbarThemeSwitch mode="dark" onModeChange={() => {}} />);
    const group = screen.getByRole('group', { name: 'Theme' });
    expect(group).not.toHaveAttribute('dir');
    expect(group).toHaveClass('h-9', 'rounded-md', 'bg-surface-dim');
    const dark = screen.getByRole('button', { name: 'Dark' });
    expect(dark).toHaveClass('bg-primary', 'text-primary-foreground');
    expect(dark).toHaveAttribute('aria-pressed', 'true');
  });

  it('is labelled in Arabic', () => {
    inBar('sidebar', <TopbarThemeSwitch mode="light" onModeChange={() => {}} />, 'ar');
    expect(screen.getByRole('group', { name: 'المظهر' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'داكن' })).toBeInTheDocument();
  });

  it('has no axe violations in every variant', async () => {
    for (const variant of ['sidebar', 'surface', 'hr'] as const) {
      const { unmount } = inBar(
        variant,
        <TopbarThemeSwitch mode="light" onModeChange={() => {}} />,
      );
      await expectNoA11yViolations();
      unmount();
    }
  });
});

describe('TopbarLanguageMenu', () => {
  it('shows the current language on a chip and switches from its menu', async () => {
    const onLocaleChange = vi.fn();
    inBar('sidebar', <TopbarLanguageMenu locale="en" onLocaleChange={onLocaleChange} />);
    const trigger = screen.getByRole('button', { name: 'Language: English' });
    expect(trigger).toHaveClass('min-h-11', 'rounded-lg');
    await userEvent.click(trigger);
    expect(await screen.findByRole('menuitemradio', { name: 'English' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'العربية' }));
    expect(onLocaleChange).toHaveBeenCalledWith('ar');
  });

  it('does not report the language that is already current', async () => {
    const onLocaleChange = vi.fn();
    inBar('surface', <TopbarLanguageMenu locale="ar" onLocaleChange={onLocaleChange} />, 'ar');
    await userEvent.click(screen.getByRole('button', { name: 'اللغة: العربية' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'العربية' }));
    expect(onLocaleChange).not.toHaveBeenCalled();
  });

  it('is a single toggle to the other language in the hr bar', async () => {
    const onLocaleChange = vi.fn();
    inBar('hr', <TopbarLanguageMenu locale="ar" onLocaleChange={onLocaleChange} />, 'ar');
    const button = screen.getByRole('button', { name: 'اللغة' });
    expect(button).toHaveClass('h-9', 'rounded-md');
    await userEvent.click(button);
    expect(onLocaleChange).toHaveBeenCalledWith('en');
  });

  it('has no axe violations closed and open', async () => {
    const { container } = inBar(
      'sidebar',
      <TopbarLanguageMenu locale="en" onLocaleChange={() => {}} />,
    );
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button'));
    await screen.findByRole('menu');
    await expectNoA11yViolations(document.body);
  });
});

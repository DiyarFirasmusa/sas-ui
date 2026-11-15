import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { ThemeSwitcher, type ThemePresetItem } from '@/components/ui/theme-switcher';
import { expectNoA11yViolations } from '@/test/a11y';

const PRESETS: ThemePresetItem[] = [
  { name: 'hr', label: 'HR', swatch: 'rgb(120, 30, 60)' },
  { name: 'inventory', label: 'Inventory', swatch: 'rgb(20, 90, 140)' },
];

function setup(variant: 'menu' | 'inline', locale: 'en' | 'ar' = 'en') {
  return render(
    <ThemeProvider
      presets={PRESETS.map((item) => item.name)}
      defaultMode="light"
      defaultLocale={locale}
      persist={false}
    >
      <ThemeSwitcher variant={variant} presets={PRESETS} />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  document.documentElement.removeAttribute('data-preset');
  document.documentElement.classList.remove('dark');
});

describe('ThemeSwitcher menu', () => {
  it('opens a menu with preset, mode and language choices', async () => {
    setup('menu');
    await userEvent.click(screen.getByRole('button', { name: 'Appearance' }));
    expect(await screen.findByRole('menuitemradio', { name: 'HR' })).toBeChecked();
    expect(screen.getByRole('menuitemradio', { name: 'Inventory' })).not.toBeChecked();
    expect(screen.getByRole('menuitemradio', { name: 'Light' })).toBeChecked();
    expect(screen.getByRole('menuitemradio', { name: 'Dark' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'System' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'English' })).toBeChecked();
  });

  it('changes the preset on <html>', async () => {
    setup('menu');
    await userEvent.click(screen.getByRole('button', { name: 'Appearance' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Inventory' }));
    expect(document.documentElement.dataset.preset).toBe('inventory');
  });

  it('switches to dark mode', async () => {
    setup('menu');
    await userEvent.click(screen.getByRole('button', { name: 'Appearance' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Dark' }));
    expect(document.documentElement).toHaveClass('dark');
  });

  it('switches language and flips direction', async () => {
    setup('menu');
    await userEvent.click(screen.getByRole('button', { name: 'Appearance' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'العربية' }));
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(screen.getByRole('button', { name: 'المظهر' })).toBeInTheDocument();
  });

  it('is operable from the keyboard', async () => {
    setup('menu');
    screen.getByRole('button', { name: 'Appearance' }).focus();
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('menuitemradio', { name: 'HR' });
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitemradio', { name: 'Inventory' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(document.documentElement.dataset.preset).toBe('inventory');
  });

  it('shows Arabic labels', async () => {
    setup('menu', 'ar');
    await userEvent.click(screen.getByRole('button', { name: 'المظهر' }));
    expect(await screen.findByRole('menuitemradio', { name: 'داكن' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'حسب النظام' })).toBeInTheDocument();
  });

  it('has no axe violations closed and open', async () => {
    setup('menu');
    await expectNoA11yViolations();
    await userEvent.click(screen.getByRole('button', { name: 'Appearance' }));
    await screen.findByRole('menu');
    await expectNoA11yViolations();
  });
});

describe('ThemeSwitcher inline', () => {
  it('renders grouped toggle buttons with the current choice pressed', () => {
    setup('inline');
    const modeGroup = screen.getByRole('group', { name: 'Mode' });
    expect(within(modeGroup).getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(modeGroup).getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'false');
    const presetGroup = screen.getByRole('group', { name: 'Theme' });
    expect(within(presetGroup).getByRole('button', { name: 'HR' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('applies a click to the document', async () => {
    setup('inline');
    await userEvent.click(screen.getByRole('button', { name: 'Dark' }));
    expect(document.documentElement).toHaveClass('dark');
    await userEvent.click(screen.getByRole('button', { name: 'Inventory' }));
    expect(document.documentElement.dataset.preset).toBe('inventory');
  });

  it('keeps a choice selected when the active segment is pressed again', async () => {
    setup('inline');
    await userEvent.click(screen.getByRole('button', { name: 'Light' }));
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches language', async () => {
    setup('inline');
    await userEvent.click(screen.getByRole('button', { name: 'العربية' }));
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByRole('group', { name: 'الوضع' })).toBeInTheDocument();
  });

  it('hides sections the app does not offer', () => {
    render(
      <ThemeProvider presets={['hr']} persist={false}>
        <ThemeSwitcher variant="inline" showLanguage={false} />
      </ThemeProvider>,
    );
    expect(screen.queryByRole('group', { name: 'Language' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Theme' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Mode' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    setup('inline');
    await expectNoA11yViolations();
  });
});

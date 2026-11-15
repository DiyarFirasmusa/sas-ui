import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from '@/components/ui/theme-provider';
import { useLocale } from '@/lib/locale';
import { MODE_STORAGE_KEY, PRESET_STORAGE_KEY, LOCALE_STORAGE_KEY } from '@/lib/theme';
import { expectNoA11yViolations } from '@/test/a11y';

const PRESETS = ['hr', 'inventory', 'wine-lapis'];

function Probe() {
  const theme = useTheme();
  const { locale } = useLocale();
  return (
    <div>
      <output data-testid="state">
        {theme.preset}|{theme.mode}|{theme.resolvedMode}|{theme.locale}|{theme.direction}|{locale}
      </output>
      <button type="button" onClick={() => theme.setPreset('inventory')}>
        preset
      </button>
      <button type="button" onClick={() => theme.setPreset('nope')}>
        bad preset
      </button>
      <button type="button" onClick={() => theme.setMode('dark')}>
        dark
      </button>
      <button type="button" onClick={() => theme.setMode('system')}>
        system
      </button>
      <button type="button" onClick={() => theme.setLocale('ar')}>
        arabic
      </button>
    </div>
  );
}

interface FakeQuery {
  matches: boolean;
  listeners: Set<(event: MediaQueryListEvent) => void>;
}

function mockSystemTheme(initialDark: boolean): FakeQuery {
  const query: FakeQuery = { matches: initialDark, listeners: new Set() };
  vi.stubGlobal('matchMedia', (media: string) => ({
    get matches() {
      return query.matches;
    },
    media,
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      query.listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      query.listeners.delete(listener);
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
  return query;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-preset');
  document.documentElement.classList.remove('dark');
  vi.unstubAllGlobals();
});

describe('ThemeProvider', () => {
  it('applies defaults to <html>', () => {
    render(
      <ThemeProvider presets={PRESETS} defaultMode="light" defaultLocale="en">
        <Probe />
      </ThemeProvider>,
    );
    const root = document.documentElement;
    expect(root.dataset.preset).toBe('hr');
    expect(root).not.toHaveClass('dark');
    expect(root.lang).toBe('en');
    expect(root.dir).toBe('ltr');
    expect(screen.getByTestId('state')).toHaveTextContent('hr|light|light|en|ltr|en');
  });

  it('changes preset, mode and language and persists them', async () => {
    render(
      <ThemeProvider presets={PRESETS} defaultMode="light">
        <Probe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'preset' }));
    await userEvent.click(screen.getByRole('button', { name: 'dark' }));
    await userEvent.click(screen.getByRole('button', { name: 'arabic' }));
    const root = document.documentElement;
    expect(root.dataset.preset).toBe('inventory');
    expect(root).toHaveClass('dark');
    expect(root.dir).toBe('rtl');
    expect(root.lang).toBe('ar');
    expect(screen.getByTestId('state')).toHaveTextContent('inventory|dark|dark|ar|rtl|ar');
    expect(localStorage.getItem(PRESET_STORAGE_KEY)).toBe('inventory');
    expect(localStorage.getItem(MODE_STORAGE_KEY)).toBe('dark');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ar');
  });

  it('ignores a preset that is not in the list', async () => {
    render(
      <ThemeProvider presets={PRESETS}>
        <Probe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'bad preset' }));
    expect(document.documentElement.dataset.preset).toBe('hr');
  });

  it('restores stored choices', () => {
    localStorage.setItem(PRESET_STORAGE_KEY, 'wine-lapis');
    localStorage.setItem(MODE_STORAGE_KEY, 'dark');
    localStorage.setItem(LOCALE_STORAGE_KEY, 'ar');
    render(
      <ThemeProvider presets={PRESETS}>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('state')).toHaveTextContent('wine-lapis|dark|dark|ar|rtl|ar');
  });

  it('keeps choices in memory when persist is off', async () => {
    render(
      <ThemeProvider presets={PRESETS} persist={false}>
        <Probe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'preset' }));
    expect(localStorage.getItem(PRESET_STORAGE_KEY)).toBeNull();
  });

  it('follows prefers-color-scheme changes while in system mode', () => {
    const query = mockSystemTheme(false);
    render(
      <ThemeProvider presets={PRESETS} defaultMode="system">
        <Probe />
      </ThemeProvider>,
    );
    expect(document.documentElement).not.toHaveClass('dark');
    act(() => {
      query.matches = true;
      query.listeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent));
    });
    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByTestId('state')).toHaveTextContent('hr|system|dark');
  });

  it('ignores the system preference once a mode is chosen explicitly', async () => {
    const query = mockSystemTheme(true);
    render(
      <ThemeProvider presets={PRESETS} defaultMode="system">
        <Probe />
      </ThemeProvider>,
    );
    expect(document.documentElement).toHaveClass('dark');
    await userEvent.click(screen.getByRole('button', { name: 'dark' }));
    act(() => {
      query.matches = false;
      query.listeners.forEach((listener) => listener({ matches: false } as MediaQueryListEvent));
    });
    expect(document.documentElement).toHaveClass('dark');
  });

  it('stops listening on unmount', () => {
    const query = mockSystemTheme(false);
    const { unmount } = render(
      <ThemeProvider presets={PRESETS}>
        <Probe />
      </ThemeProvider>,
    );
    expect(query.listeners.size).toBe(1);
    unmount();
    expect(query.listeners.size).toBe(0);
  });

  it('throws a clear error outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/ThemeProvider/);
  });

  it('has no axe violations', async () => {
    render(
      <ThemeProvider presets={PRESETS}>
        <Probe />
      </ThemeProvider>,
    );
    await expectNoA11yViolations();
  });
});

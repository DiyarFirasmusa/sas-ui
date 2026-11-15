import { Button } from '@/components/ui/button';
import { MenuIcon, MoonIcon, SunIcon } from '@/components/ui/icons';
import { Select } from '@/components/ui/select';
import { PRESET_OPTIONS, useDocsSettings } from './docs-settings';

/** Preset, colour mode, language and direction — everything a component must survive. */
export function Toolbar({ onMenu }: { onMenu: () => void }) {
  const { preset, setPreset, mode, setMode, locale, setLocale, direction, setDirection } = useDocsSettings();
  const isDark = mode === 'dark' || (mode === 'system' && document.documentElement.classList.contains('dark'));
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-field border-b border-stroke bg-surface px-row py-inline">
      <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu" onClick={onMenu}>
        <MenuIcon />
      </Button>
      <a href="#/" className="text-h4 text-text-primary me-auto">
        SAS UI
      </a>
      <Select
        aria-label="Preset"
        className="w-40"
        value={preset}
        onValueChange={(value) => value && setPreset(value)}
        options={PRESET_OPTIONS}
      />
      <Button
        variant="outline"
        size="icon"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={() => setMode(isDark ? 'light' : 'dark')}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </Button>
      <Button variant="outline" aria-pressed={locale === 'ar'} onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}>
        {locale === 'ar' ? 'العربية' : 'English'}
      </Button>
      <Button variant="outline" onClick={() => setDirection(direction === 'rtl' ? 'ltr' : 'rtl')}>
        {direction.toUpperCase()}
      </Button>
    </header>
  );
}

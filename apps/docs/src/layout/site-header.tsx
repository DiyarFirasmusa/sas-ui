import { Button } from '@/components/ui/button';
import { MenuIcon, MoonIcon, SearchIcon, SunIcon } from '@/components/ui/icons';
import { Kbd } from '@/components/ui/kbd';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { PRESET_OPTIONS, useDocsSettings } from '../docs-settings';
import type { Route } from '../use-hash-route';

const NAV = [
  { label: 'Docs', hash: '#/docs/introduction', pages: ['docs'] },
  { label: 'Components', hash: '#/components', pages: ['components', 'component'] },
  { label: 'Blocks', hash: '#/blocks', pages: ['blocks', 'block'] },
  { label: 'Charts', hash: '#/charts', pages: ['charts'] },
  { label: 'Themes', hash: '#/themes', pages: ['themes', 'tokens'] },
] as const;

/** Top bar: brand, five sections, search, and the controls every component must survive. */
export function SiteHeader({
  route,
  onMenu,
  onSearch,
}: {
  route: Route;
  onMenu: () => void;
  onSearch: () => void;
}) {
  const { preset, setPreset, mode, setMode, locale, setLocale, direction, setDirection } =
    useDocsSettings();
  const isDark =
    mode === 'dark' || (mode === 'system' && document.documentElement.classList.contains('dark'));
  return (
    <header className="border-stroke bg-background/90 sticky top-0 z-30 border-b backdrop-blur">
      <div className="gap-field px-row mx-auto flex h-14 max-w-[100rem] items-center">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Menu"
          onClick={onMenu}
        >
          <MenuIcon />
        </Button>
        <a href="#/" className="text-h4 text-text-primary me-4 flex items-center gap-2">
          <span
            aria-hidden="true"
            className="bg-primary text-b3 text-primary-foreground grid size-7 place-items-center rounded-md font-bold"
          >
            S
          </span>
          <span className="max-sm:hidden">SAS UI</span>
        </a>
        <nav aria-label="Main" className="flex items-center gap-1 max-md:hidden">
          {NAV.map((entry) => {
            const active = (entry.pages as readonly string[]).includes(route.page);
            return (
              <a
                key={entry.label}
                href={entry.hash}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-md px-inline py-1.5 text-b1 text-text-secondary hover:text-text-primary',
                  active && 'font-semibold text-text-primary',
                )}
              >
                {entry.label}
              </a>
            );
          })}
        </nav>

        <div className="gap-field ms-auto flex items-center">
          <button
            type="button"
            onClick={onSearch}
            className="rounded-control border-stroke bg-surface text-b2 text-text-muted hover:bg-hover-row flex h-9 w-9 shrink-0 items-center gap-2 border px-2 xl:w-64"
            aria-label="Search documentation"
          >
            <SearchIcon />
            <span className="flex-1 text-start max-xl:hidden">Search documentation…</span>
            <Kbd className="max-xl:hidden" keys={['⌘', 'K']} />
          </button>
          <Select
            aria-label="Preset"
            className="w-36 max-xl:hidden"
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
          <Button
            variant="outline"
            aria-pressed={locale === 'ar'}
            onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
          >
            {locale === 'ar' ? 'العربية' : 'EN'}
          </Button>
          <Button
            variant="outline"
            className="max-sm:hidden"
            onClick={() => setDirection(direction === 'rtl' ? 'ltr' : 'rtl')}
          >
            {direction.toUpperCase()}
          </Button>
        </div>
      </div>
    </header>
  );
}

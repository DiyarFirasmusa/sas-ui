import { MoonIcon, SunIcon } from '@/components/ui/icons';
import { useLabels, type Locale, type Messages } from '@/lib/locale';
import { resolveMode, systemPrefersDark, type ColorMode } from '@/lib/theme';
import { cn } from '@/lib/utils';

const messages: Messages<'language' | 'theme' | 'light' | 'dark' | 'arabic' | 'english'> = {
  en: {
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    arabic: 'العربية',
    english: 'English',
  },
  ar: {
    language: 'اللغة',
    theme: 'المظهر',
    light: 'فاتح',
    dark: 'داكن',
    arabic: 'العربية',
    english: 'English',
  },
};

const GROUP =
  'inline-flex items-center gap-0.5 rounded-pill border border-stroke bg-secondary p-0.5';
const ITEM =
  'inline-flex h-8 items-center gap-field rounded-pill px-3 text-button-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-highlight';
const ACTIVE = 'bg-primary text-primary-foreground';
const IDLE = 'text-text-secondary hover:text-text-primary';

interface AuthSwitchersProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  mode: ColorMode;
  onModeChange: (mode: 'light' | 'dark') => void;
  labels?: Partial<Record<keyof (typeof messages)['en'], string>>;
  className?: string;
}

/**
 * The language and theme pills in the corner of the dashboards' sign-in card.
 * Hand it to `Login02`'s `switcher` slot.
 */
function AuthSwitchers({
  locale,
  onLocaleChange,
  mode,
  onModeChange,
  labels: overrides,
  className,
}: AuthSwitchersProps) {
  const labels = useLabels(messages, overrides);
  const current = resolveMode(mode, systemPrefersDark());
  const languages = [
    { value: 'ar', label: labels.arabic },
    { value: 'en', label: labels.english },
  ] as const;
  const themes = [
    { value: 'light', label: labels.light, Icon: SunIcon },
    { value: 'dark', label: labels.dark, Icon: MoonIcon },
  ] as const;

  return (
    <div
      data-slot="auth-switchers"
      className={cn('flex flex-wrap items-center gap-field', className)}
    >
      <div role="group" aria-label={labels.language} className={GROUP}>
        {languages.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            lang={value}
            aria-pressed={locale === value}
            onClick={() => {
              onLocaleChange(value);
            }}
            className={cn(ITEM, locale === value ? ACTIVE : IDLE)}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="group" aria-label={labels.theme} className={GROUP}>
        {themes.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={current === value}
            onClick={() => {
              onModeChange(value);
            }}
            className={cn(ITEM, current === value ? ACTIVE : IDLE)}
          >
            <Icon />
            <span className="max-sm:sr-only">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export { AuthSwitchers };
export type { AuthSwitchersProps };

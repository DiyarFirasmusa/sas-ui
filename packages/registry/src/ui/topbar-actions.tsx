import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoonIcon, SunIcon } from '@/components/ui/icons';
import { topbarChip, useTopbarVariant } from '@/components/ui/topbar';
import { GlobeIcon } from '@/components/ui/topbar-icons';
import { useLabels, type Locale, type Messages } from '@/lib/locale';
import { resolveMode, systemPrefersDark, type ColorMode } from '@/lib/theme';
import { cn } from '@/lib/utils';

const messages: Messages<'theme' | 'light' | 'dark' | 'language' | 'arabic' | 'english'> = {
  en: {
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    language: 'Language',
    arabic: 'العربية',
    english: 'English',
  },
  ar: {
    theme: 'المظهر',
    light: 'فاتح',
    dark: 'داكن',
    language: 'اللغة',
    arabic: 'العربية',
    english: 'English',
  },
};

type LabelOverrides = Partial<Record<keyof (typeof messages)['en'], string>>;

interface TopbarThemeSwitchProps {
  /** Current choice; `system` shows whichever of light and dark the OS prefers. */
  mode: ColorMode;
  onModeChange: (mode: 'light' | 'dark') => void;
  labels?: LabelOverrides;
  className?: string;
}

const SEGMENT = {
  sidebar: {
    group: 'h-9.5 gap-0.5 rounded-xl border border-sidebar-border bg-sidebar-foreground/10 p-1',
    item: 'h-7 w-10 rounded-[9px] focus-visible:outline-sidebar-ring',
    idle: 'text-sidebar-foreground/70 hover:text-sidebar-foreground',
  },
  surface: {
    group: 'h-9.5 gap-0.5 rounded-xl border border-sidebar-border bg-surface-solid-secondary p-1',
    item: 'h-7 w-10 rounded-[9px] focus-visible:outline-primary-highlight',
    idle: 'text-text-secondary hover:text-text-primary',
  },
  hr: {
    group: 'h-9 gap-0.5 rounded-md border border-stroke bg-surface-dim p-0.5',
    item: 'h-full gap-1.5 rounded-sm px-2.5 text-b3 focus-visible:outline-primary',
    idle: 'text-text-secondary hover:text-text-primary',
  },
} as const;

/**
 * Light / dark switch: two icon buttons in a pill (labelled in the `hr` bar),
 * the current one pressed. The group stays left-to-right so the sun is always
 * on the left, as in the dashboards.
 */
function TopbarThemeSwitch({
  mode,
  onModeChange,
  labels: overrides,
  className,
}: TopbarThemeSwitchProps) {
  const labels = useLabels(messages, overrides);
  const variant = useTopbarVariant();
  const style = SEGMENT[variant];
  const current = resolveMode(mode, systemPrefersDark());
  const options = [
    { value: 'light', label: labels.light, Icon: SunIcon },
    { value: 'dark', label: labels.dark, Icon: MoonIcon },
  ] as const;

  return (
    <div
      data-slot="topbar-theme-switch"
      dir={variant === 'hr' ? undefined : 'ltr'}
      role="group"
      aria-label={labels.theme}
      className={cn('inline-flex items-center', style.group, className)}
    >
      {options.map(({ value, label, Icon }) => {
        const pressed = current === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={pressed}
            aria-label={variant === 'hr' ? undefined : label}
            onClick={() => {
              onModeChange(value);
            }}
            className={cn(
              'flex items-center justify-center transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2',
              style.item,
              pressed
                ? variant === 'hr'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary-container text-primary-foreground'
                : style.idle,
            )}
          >
            <Icon aria-hidden="true" className={variant === 'hr' ? 'size-3.5' : 'size-[15px]'} />
            {variant === 'hr' ? label : null}
          </button>
        );
      })}
    </div>
  );
}

interface TopbarLanguageMenuProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  labels?: LabelOverrides;
  className?: string;
}

/**
 * Language control: a chip showing the current language that opens a short
 * menu (the `hr` bar instead shows one button that flips to the other
 * language). The name collapses to an icon below `md`.
 */
function TopbarLanguageMenu({
  locale,
  onLocaleChange,
  labels: overrides,
  className,
}: TopbarLanguageMenuProps) {
  const labels = useLabels(messages, overrides);
  const variant = useTopbarVariant();
  const names: Record<Locale, string> = { ar: labels.arabic, en: labels.english };
  const trigger = `${labels.language}: ${names[locale]}`;

  if (variant === 'hr') {
    const other: Locale = locale === 'ar' ? 'en' : 'ar';
    return (
      <button
        type="button"
        data-slot="topbar-language"
        aria-label={labels.language}
        lang={locale}
        onClick={() => {
          onLocaleChange(other);
        }}
        className={cn(topbarChip(variant, 'text'), className)}
      >
        <GlobeIcon aria-hidden="true" />
        {names[locale]}
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-slot="topbar-language"
        aria-label={trigger}
        className={cn(topbarChip(variant, 'text'), className)}
      >
        <GlobeIcon aria-hidden="true" className="size-4.5" />
        <span className="max-md:sr-only">{names[locale]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-inline py-field text-h4 text-text-primary">
            {labels.language}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(value) => {
            if ((value === 'ar' || value === 'en') && value !== locale) {
              onLocaleChange(value);
            }
          }}
        >
          <DropdownMenuRadioItem value="ar" lang="ar">
            {labels.arabic}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en" lang="en">
            {labels.english}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { TopbarLanguageMenu, TopbarThemeSwitch };
export type { TopbarLanguageMenuProps, TopbarThemeSwitchProps };

import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoonIcon, SunIcon, type IconProps } from '@/components/ui/icons';
import { useTheme } from '@/components/ui/theme-provider';
import { useLabels, type Locale, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';
import { COLOR_MODES, isColorMode, isLocale, type ColorMode } from '@/lib/theme';

const messages: Messages<
  'appearance' | 'preset' | 'mode' | 'language' | 'light' | 'dark' | 'system' | 'arabic' | 'english'
> = {
  en: {
    appearance: 'Appearance',
    preset: 'Theme',
    mode: 'Mode',
    language: 'Language',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    arabic: 'العربية',
    english: 'English',
  },
  ar: {
    appearance: 'المظهر',
    preset: 'السمة',
    mode: 'الوضع',
    language: 'اللغة',
    light: 'فاتح',
    dark: 'داكن',
    system: 'حسب النظام',
    arabic: 'العربية',
    english: 'English',
  },
};

interface ThemePresetItem {
  /** Value written to `data-preset`; must be one of the provider's presets. */
  name: string;
  label: string;
  /** The preset's primary colour, any CSS colour value. */
  swatch: string;
}

interface ThemeSwitcherProps {
  /** `menu` is a compact icon button with a dropdown; `inline` shows every choice as segmented controls. */
  variant?: 'menu' | 'inline';
  /** Presets to offer, each with the swatch to preview it. Omit to hide the preset choice. */
  presets?: readonly ThemePresetItem[];
  /** Hide a section the app does not offer. All shown by default. */
  showMode?: boolean;
  showLanguage?: boolean;
  labels?: Partial<Record<keyof (typeof messages)['en'], string>>;
  className?: string;
}

const LANGUAGES: readonly Locale[] = ['ar', 'en'];

function MonitorIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="size-4 shrink-0"
      {...props}
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function Swatch({ color }: { color: string }) {
  // Inline colour is intentional: the preset's primary is data supplied by the app.
  return (
    <span
      aria-hidden="true"
      className="size-4 shrink-0 rounded-full border border-stroke"
      style={{ backgroundColor: color }}
    />
  );
}

const modeIcons: Record<ColorMode, (props: IconProps) => ReactNode> = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
};

function useSwitcherLabels(overrides: ThemeSwitcherProps['labels']) {
  const labels = useLabels(messages, overrides);
  const modeLabels: Record<ColorMode, string> = {
    light: labels.light,
    dark: labels.dark,
    system: labels.system,
  };
  const languageLabels: Record<Locale, string> = {
    ar: labels.arabic,
    en: labels.english,
  };
  return { labels, modeLabels, languageLabels };
}

function ThemeSwitcherMenu({
  presets,
  showMode,
  showLanguage,
  labels: overrides,
  className,
}: ThemeSwitcherProps) {
  const theme = useTheme();
  const { labels, modeLabels, languageLabels } = useSwitcherLabels(overrides);
  const hasPresets = presets !== undefined && presets.length > 0;
  const TriggerIcon = theme.resolvedMode === 'dark' ? MoonIcon : SunIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={labels.appearance}
            data-slot="theme-switcher"
            className={className}
          />
        }
      >
        <TriggerIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {hasPresets ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel>{labels.preset}</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme.preset} onValueChange={theme.setPreset}>
              {presets.map((item) => (
                <DropdownMenuRadioItem key={item.name} value={item.name}>
                  <Swatch color={item.swatch} />
                  {item.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        ) : null}
        {showMode ? (
          <>
            {hasPresets ? <DropdownMenuSeparator /> : null}
            <DropdownMenuGroup>
              <DropdownMenuLabel>{labels.mode}</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={theme.mode}
                onValueChange={(value) => {
                  if (isColorMode(value)) {
                    theme.setMode(value);
                  }
                }}
              >
                {COLOR_MODES.map((mode) => {
                  const Icon = modeIcons[mode];
                  return (
                    <DropdownMenuRadioItem key={mode} value={mode}>
                      <Icon />
                      {modeLabels[mode]}
                    </DropdownMenuRadioItem>
                  );
                })}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </>
        ) : null}
        {showLanguage ? (
          <>
            {hasPresets || showMode ? <DropdownMenuSeparator /> : null}
            <DropdownMenuGroup>
              <DropdownMenuLabel>{labels.language}</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={theme.locale}
                onValueChange={(value) => {
                  if (isLocale(value)) {
                    theme.setLocale(value);
                  }
                }}
              >
                {LANGUAGES.map((locale) => (
                  <DropdownMenuRadioItem key={locale} value={locale} lang={locale}>
                    {languageLabels[locale]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SegmentedOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SegmentedProps {
  label: string;
  value: string;
  options: readonly SegmentedOption[];
  onChange: (value: string) => void;
}

/** One pressed segment at a time; arrow keys move between segments (Base UI toggle group). */
function Segmented({ label, value, options, onChange }: SegmentedProps) {
  return (
    <div className="flex flex-col gap-field">
      <span className="text-label text-text-secondary">{label}</span>
      <ToggleGroup
        aria-label={label}
        value={[value]}
        onValueChange={(next) => {
          // Pressing the active segment would unset it; a choice always stays selected.
          const picked = next[0];
          if (picked !== undefined) {
            onChange(picked);
          }
        }}
        className="inline-flex w-fit max-w-full flex-wrap rounded-control border border-stroke bg-surface p-0.5"
      >
        {options.map((option) => (
          <Toggle
            key={option.value}
            value={option.value}
            className={cn(
              'inline-flex min-h-8 items-center gap-field rounded-md px-inline text-button-2 text-text-secondary outline-none transition-colors',
              'hover:bg-hover-row data-[pressed]:bg-primary-light data-[pressed]:text-primary-text',
              'focus-visible:ring-2 focus-visible:ring-ring',
              "[&_svg:not([class*='size-'])]:size-4",
            )}
          >
            {option.icon}
            {option.label}
          </Toggle>
        ))}
      </ToggleGroup>
    </div>
  );
}

function ThemeSwitcherInline({
  presets,
  showMode,
  showLanguage,
  labels: overrides,
  className,
}: ThemeSwitcherProps) {
  const theme = useTheme();
  const { labels, modeLabels, languageLabels } = useSwitcherLabels(overrides);

  return (
    <div
      data-slot="theme-switcher"
      className={cn('flex flex-wrap items-start gap-row', className)}
    >
      {presets !== undefined && presets.length > 0 ? (
        <Segmented
          label={labels.preset}
          value={theme.preset}
          onChange={theme.setPreset}
          options={presets.map((item) => ({
            value: item.name,
            label: item.label,
            icon: <Swatch color={item.swatch} />,
          }))}
        />
      ) : null}
      {showMode ? (
        <Segmented
          label={labels.mode}
          value={theme.mode}
          onChange={(value) => {
            if (isColorMode(value)) {
              theme.setMode(value);
            }
          }}
          options={COLOR_MODES.map((mode) => {
            const Icon = modeIcons[mode];
            return { value: mode, label: modeLabels[mode], icon: <Icon /> };
          })}
        />
      ) : null}
      {showLanguage ? (
        <Segmented
          label={labels.language}
          value={theme.locale}
          onChange={(value) => {
            if (isLocale(value)) {
              theme.setLocale(value);
            }
          }}
          options={LANGUAGES.map((locale) => ({ value: locale, label: languageLabels[locale] }))}
        />
      ) : null}
    </div>
  );
}

/**
 * Appearance controls for `ThemeProvider`: preset (with colour swatches),
 * light/dark/system and language/direction. Needs a `ThemeProvider` above it.
 */
function ThemeSwitcher({
  variant = 'menu',
  showMode = true,
  showLanguage = true,
  ...props
}: ThemeSwitcherProps) {
  return variant === 'inline' ? (
    <ThemeSwitcherInline showMode={showMode} showLanguage={showLanguage} {...props} />
  ) : (
    <ThemeSwitcherMenu showMode={showMode} showLanguage={showLanguage} {...props} />
  );
}

export { ThemeSwitcher };
export type { ThemePresetItem, ThemeSwitcherProps };

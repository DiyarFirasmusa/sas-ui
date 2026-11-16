import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { useState, type ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoonIcon, SettingsIcon, SunIcon } from '@/components/ui/icons';
import { useLabels, type Locale, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<
  | 'title'
  | 'description'
  | 'language'
  | 'languageDescription'
  | 'arabic'
  | 'english'
  | 'preset'
  | 'presetDescription'
  | 'mode'
  | 'modeDescription'
  | 'light'
  | 'dark'
  | 'system'
> = {
  en: {
    title: 'Preferences',
    description: 'Language and appearance. Changes apply as soon as you pick them.',
    language: 'Language',
    languageDescription: 'The interface language and reading direction.',
    arabic: 'العربية',
    english: 'English',
    preset: 'Theme',
    presetDescription: 'The colour palette used across the app.',
    mode: 'Mode',
    modeDescription: 'Light, dark, or follow your device.',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
  ar: {
    title: 'التفضيلات',
    description: 'اللغة والمظهر. تُطبَّق التغييرات فور اختيارها.',
    language: 'اللغة',
    languageDescription: 'لغة الواجهة واتجاه القراءة.',
    arabic: 'العربية',
    english: 'English',
    preset: 'السمة',
    presetDescription: 'لوحة الألوان المستخدمة في التطبيق.',
    mode: 'الوضع',
    modeDescription: 'فاتح أو داكن أو حسب جهازك.',
    light: 'فاتح',
    dark: 'داكن',
    system: 'حسب النظام',
  },
};

type Settings01PreferencesLabels = Partial<Record<keyof (typeof messages)['en'], string>>;

type Settings01Mode = 'light' | 'dark' | 'system';

interface Settings01Preferences {
  language: Locale;
  /** One of the `presets` names. */
  preset: string;
  mode: Settings01Mode;
}

/** Same shape as `ThemeSwitcher`'s presets, so the app can pass one list to both. */
interface Settings01Preset {
  name: string;
  label: string;
  /** The preset's primary colour, any CSS colour value. */
  swatch: string;
}

const SAMPLE_PRESETS: readonly Settings01Preset[] = [
  { name: 'neutral', label: 'Neutral', swatch: 'oklch(0.21 0.006 285)' },
  { name: 'hr', label: 'HR', swatch: 'oklch(0.47 0.2 295)' },
];

const DEFAULT_PREFERENCES: Settings01Preferences = {
  language: 'en',
  preset: 'neutral',
  mode: 'system',
};

function isMode(value: string): value is Settings01Mode {
  return value === 'light' || value === 'dark' || value === 'system';
}

function isLanguage(value: string): value is Locale {
  return value === 'ar' || value === 'en';
}

interface SegmentedOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

/** One pressed segment at a time; arrow keys move between segments (Base UI toggle group). */
function Segmented({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  options: readonly SegmentedOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="gap-field flex flex-col">
      <div>
        <span className="text-label text-text-secondary block">{label}</span>
        <span className="text-b3 text-text-muted block">{description}</span>
      </div>
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
        className="rounded-control border-stroke bg-surface inline-flex w-fit max-w-full flex-wrap border p-0.5"
      >
        {options.map((option) => (
          <Toggle
            key={option.value}
            value={option.value}
            className={cn(
              'gap-field px-inline text-button-2 text-text-secondary inline-flex min-h-11 items-center rounded-md outline-none transition-colors sm:min-h-8',
              'hover:bg-hover-row data-[pressed]:bg-primary-light data-[pressed]:text-primary-text',
              'focus-visible:ring-ring focus-visible:ring-2 motion-reduce:transition-none',
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

interface Settings01PreferencesProps {
  /** Controlled choices. Omit to let the section keep them (starting from `defaultValue`). */
  value?: Settings01Preferences;
  defaultValue?: Settings01Preferences;
  /** Called with the full next choices whenever one segment changes. */
  onChange?: (next: Settings01Preferences) => void;
  /** Presets to offer, each with the swatch that previews it. Omit to hide the theme choice. */
  presets?: readonly Settings01Preset[];
  labels?: Settings01PreferencesLabels;
}

/**
 * Language, theme preset and light/dark/system as segmented controls. It does
 * not need a `ThemeProvider`: it reports choices through `onChange`, and the
 * app applies them (with `ThemeProvider`, call its `setLocale`, `setPreset`
 * and `setMode` there).
 */
function Settings01PreferencesSection({
  value,
  defaultValue = DEFAULT_PREFERENCES,
  onChange,
  presets = SAMPLE_PRESETS,
  labels: overrides,
}: Settings01PreferencesProps) {
  const labels = useLabels(messages, overrides);
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;

  function update(patch: Partial<Settings01Preferences>) {
    const next = { ...current, ...patch };
    setInternal(next);
    onChange?.(next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">{labels.title}</CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent className="gap-card flex flex-col">
        <Segmented
          label={labels.language}
          description={labels.languageDescription}
          value={current.language}
          onChange={(next) => {
            if (isLanguage(next)) {
              update({ language: next });
            }
          }}
          options={[
            { value: 'ar', label: labels.arabic },
            { value: 'en', label: labels.english },
          ]}
        />
        {presets.length > 0 ? (
          <Segmented
            label={labels.preset}
            description={labels.presetDescription}
            value={current.preset}
            onChange={(next) => update({ preset: next })}
            options={presets.map((item) => ({
              value: item.name,
              label: item.label,
              icon: (
                // Inline colour is intentional: the preset's primary is data supplied by the app.
                <span
                  aria-hidden="true"
                  className="border-stroke size-4 shrink-0 rounded-full border"
                  style={{ backgroundColor: item.swatch }}
                />
              ),
            }))}
          />
        ) : null}
        <Segmented
          label={labels.mode}
          description={labels.modeDescription}
          value={current.mode}
          onChange={(next) => {
            if (isMode(next)) {
              update({ mode: next });
            }
          }}
          options={[
            { value: 'light', label: labels.light, icon: <SunIcon /> },
            { value: 'dark', label: labels.dark, icon: <MoonIcon /> },
            { value: 'system', label: labels.system, icon: <SettingsIcon /> },
          ]}
        />
      </CardContent>
    </Card>
  );
}

export { DEFAULT_PREFERENCES, SAMPLE_PRESETS, Settings01PreferencesSection };
export type {
  Settings01Mode,
  Settings01Preferences,
  Settings01PreferencesLabels,
  Settings01PreferencesProps,
  Settings01Preset,
};

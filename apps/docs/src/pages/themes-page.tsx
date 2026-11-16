import { PRESETS } from '@sas-ui/tokens/all-presets';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CommandChip } from '../code-block';
import { useDocsSettings } from '../docs-settings';
import { presetDescription, useT } from '../i18n/use-t';

/** A miniature dashboard painted with one preset, pinned to one mode, independent of the page theme. */
function PresetPreview({ preset, mode }: { preset: string; mode: 'light' | 'dark' }) {
  const t = useT();
  return (
    <div
      data-preset-scope={preset}
      data-mode={mode}
      className="gap-field border-stroke bg-background p-row text-foreground flex flex-1 flex-col rounded-xl border"
    >
      <div className="gap-field flex items-center justify-between">
        <span className="text-h5">{t('themes.sampleRevenue')}</span>
        <Badge tone="green">+12.5%</Badge>
      </div>
      <p className="text-kpi text-text-primary">$48,250</p>
      <div className="flex h-10 items-end gap-1" aria-hidden="true">
        {[40, 65, 50, 80, 60, 90, 70].map((height, index) => (
          <span
            key={index}
            className="flex-1 rounded-sm"
            style={{ height: `${height}%`, background: `var(--chart-${(index % 5) + 1})` }}
          />
        ))}
      </div>
      <div className="gap-field flex flex-wrap">
        <Button size="sm">{t('themes.sampleSave')}</Button>
        <Button size="sm" variant="outline">
          {t('themes.sampleCancel')}
        </Button>
        <Badge tone="primary">{t('themes.sampleActive')}</Badge>
      </div>
    </div>
  );
}

/** Themes gallery: every preset in light and dark, a pick button and its CLI command. */
export function ThemesPage() {
  const { preset, setPreset, locale } = useDocsSettings();
  const t = useT();
  return (
    <div className="gap-card mx-auto flex max-w-6xl flex-col">
      <header className="gap-field py-card flex flex-col items-center text-center">
        <h1 className="text-h1 text-text-primary text-balance md:text-[2.75rem] md:leading-tight">
          {t('themes.title')}
        </h1>
        <p className="text-b1 text-text-secondary max-w-2xl">{t('themes.subtitle')}</p>
        <Button variant="outline" render={<a href="#/tokens" />} nativeButton={false}>
          {t('themes.browseTokens')}
        </Button>
      </header>
      <ul className="gap-card grid">
        {PRESETS.map((entry) => (
          <li
            key={entry.name}
            className="gap-row border-stroke bg-surface p-card flex flex-col rounded-2xl border"
          >
            <div className="gap-field flex flex-wrap items-start justify-between">
              <div>
                <h2 id={entry.name} className="text-h3 scroll-mt-24">
                  {entry.label[locale]}{' '}
                  <span className="text-text-muted">
                    · {entry.label[locale === 'ar' ? 'en' : 'ar']}
                  </span>
                </h2>
                <p className="text-b2 text-text-secondary">{presetDescription(t, entry)}</p>
              </div>
              <div className="gap-field flex flex-wrap items-center">
                <CommandChip command={`npx sas-ui init --preset ${entry.name}`} />
                <Button
                  size="sm"
                  variant={preset === entry.name ? 'default' : 'outline'}
                  aria-pressed={preset === entry.name}
                  onClick={() => setPreset(entry.name)}
                >
                  {preset === entry.name ? t('themes.applied') : t('themes.tryIt')}
                </Button>
              </div>
            </div>
            <div className="gap-row flex flex-col md:flex-row">
              <PresetPreview preset={entry.name} mode="light" />
              <PresetPreview preset={entry.name} mode="dark" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

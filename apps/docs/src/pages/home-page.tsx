import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { blocks, items } from '../catalog';
import { CommandChip } from '../code-block';
import type { MessageKey } from '../i18n/messages';
import { useT } from '../i18n/use-t';

const FEATURES: readonly (readonly [title: MessageKey, text: MessageKey])[] = [
  ['home.feature.rtl.title', 'home.feature.rtl.text'],
  ['home.feature.open.title', 'home.feature.open.text'],
  ['home.feature.themes.title', 'home.feature.themes.text'],
  ['home.feature.erp.title', 'home.feature.erp.text'],
  ['home.feature.a11y.title', 'home.feature.a11y.text'],
  ['home.feature.cli.title', 'home.feature.cli.text'],
];

/** Landing page: headline, two calls to action, a live block and the feature grid. */
export function HomePage() {
  const t = useT();
  const components = items.filter((item) => item.type === 'ui').length;
  return (
    <div className="gap-card mx-auto flex max-w-6xl flex-col">
      <header className="gap-row py-page flex flex-col items-center text-center">
        <a
          href="#/blocks"
          className="rounded-pill bg-hover-row px-inline text-b3 text-text-secondary hover:text-text-primary py-1"
        >
          {t('home.badge', { count: blocks.length })}
        </a>
        <h1 className="text-text-primary font-heading max-w-3xl text-[2.25rem] leading-tight font-bold text-balance md:text-[3.25rem]">
          {t('home.title')}
        </h1>
        <p className="text-b1 text-text-secondary md:text-h4 max-w-2xl md:font-normal">
          {t('home.subtitle')}
        </p>
        <div className="gap-field flex flex-wrap justify-center">
          <Button size="lg" render={<a href="#/docs/installation" />} nativeButton={false}>
            {t('home.getStarted')}
          </Button>
          <Button size="lg" variant="outline" render={<a href="#/blocks" />} nativeButton={false}>
            {t('home.browseBlocks')}
          </Button>
        </div>
        <CommandChip command="npx sas-ui init --preset wine-lapis" />
        <div className="gap-field text-b2 text-text-muted flex flex-wrap justify-center">
          <Badge tone="primary">{t('home.badgeComponents', { count: components })}</Badge>
          <Badge tone="purple">{t('home.badgeBlocks', { count: blocks.length })}</Badge>
          <Badge tone="green">{t('home.badgePresets')}</Badge>
          <Badge tone="blue">RTL · LTR</Badge>
        </div>
      </header>

      <div className="border-stroke bg-surface-dim shadow-large overflow-hidden rounded-2xl border p-2">
        <iframe
          title={t('home.previewTitle')}
          src="#/preview/dashboard-01"
          loading="lazy"
          className="border-stroke bg-background block h-[640px] w-full rounded-xl border"
        />
      </div>

      <section
        className="gap-row pt-card grid sm:grid-cols-2 lg:grid-cols-3"
        aria-label={t('home.featuresLabel')}
      >
        {FEATURES.map(([title, text]) => (
          <div
            key={title}
            className="border-stroke bg-surface p-row flex flex-col gap-1 rounded-xl border"
          >
            <h2 className="text-h5 text-text-primary">{t(title)}</h2>
            <p className="text-b2 text-text-secondary">{t(text)}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

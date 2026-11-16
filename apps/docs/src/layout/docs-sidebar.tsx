import { cn } from '@/lib/utils';
import { CATEGORY_ORDER, items } from '../catalog';
import { useDocsSettings } from '../docs-settings';
import { localizeItem } from '../i18n/localize-item';
import { DOC_TITLE_KEYS, type MessageKey } from '../i18n/messages';
import { categoryTitle, useT } from '../i18n/use-t';
import { DOC_SLUGS, type Route } from '../use-hash-route';

function itemClass(active: boolean) {
  return cn(
    'block rounded-md px-inline py-1.5 text-b2 text-text-secondary transition-colors hover:text-text-primary',
    active && 'bg-hover-row font-semibold text-text-primary',
  );
}

function GroupTitle({ children, first = false }: { children: string; first?: boolean }) {
  return (
    <h2
      className={cn(
        'px-inline pb-1 text-label tracking-wide text-text-muted uppercase',
        !first && 'mt-card border-t border-stroke-subtle pt-row',
      )}
    >
      {children}
    </h2>
  );
}

/** The docs/components tree: clearly separated groups with a divider and a heading each. */
export function DocsSidebar({ route, onNavigate }: { route: Route; onNavigate: () => void }) {
  const { locale } = useDocsSettings();
  const t = useT();
  const components = items
    .filter((item) => item.type === 'ui')
    .map((item) => localizeItem(item, locale));
  const helpers = items
    .filter((item) => item.type !== 'ui' && item.type !== 'block')
    .map((item) => localizeItem(item, locale));
  const browse: [MessageKey, string, boolean][] = [
    ['nav.allComponents', '#/components', route.page === 'components'],
    ['nav.blocks', '#/blocks', route.page === 'blocks' || route.page === 'block'],
    ['nav.charts', '#/charts', route.page === 'charts'],
    ['nav.themes', '#/themes', route.page === 'themes'],
    ['nav.tokens', '#/tokens', route.page === 'tokens'],
  ];
  return (
    <nav aria-label={t('sidebar.label')} className="p-row flex flex-col gap-0.5 text-start">
      <GroupTitle first>{t('sidebar.getStarted')}</GroupTitle>
      {DOC_SLUGS.map((slug) => {
        const active = route.page === 'docs' && route.slug === slug;
        return (
          <a
            key={slug}
            href={`#/docs/${slug}`}
            onClick={onNavigate}
            className={itemClass(active)}
            aria-current={active ? 'page' : undefined}
          >
            {t(DOC_TITLE_KEYS[slug])}
          </a>
        );
      })}

      <GroupTitle>{t('sidebar.browse')}</GroupTitle>
      {browse.map(([label, hash, active]) => (
        <a
          key={hash}
          href={hash}
          onClick={onNavigate}
          className={itemClass(active)}
          aria-current={active ? 'page' : undefined}
        >
          {t(label)}
        </a>
      ))}

      {CATEGORY_ORDER.map((category) => {
        const group = components.filter((item) => item.category === category);
        if (group.length === 0) {
          return null;
        }
        return (
          <div key={category} className="flex flex-col gap-0.5">
            <GroupTitle>{categoryTitle(t, category)}</GroupTitle>
            {group.map((item) => {
              const active = route.page === 'component' && route.name === item.name;
              return (
                <a
                  key={item.name}
                  href={`#/components/${item.name}`}
                  onClick={onNavigate}
                  dir="auto"
                  className={itemClass(active)}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.title}
                </a>
              );
            })}
          </div>
        );
      })}

      <GroupTitle>{t('sidebar.helpers')}</GroupTitle>
      {helpers.map((item) => {
        const active = route.page === 'component' && route.name === item.name;
        return (
          <a
            key={item.name}
            href={`#/components/${item.name}`}
            onClick={onNavigate}
            dir="auto"
            className={itemClass(active)}
            aria-current={active ? 'page' : undefined}
          >
            {item.title}
          </a>
        );
      })}
    </nav>
  );
}

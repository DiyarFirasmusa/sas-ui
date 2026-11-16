import { cn } from '@/lib/utils';
import { CATEGORY_ORDER, items } from '../catalog';
import { DOC_SLUGS, type Route } from '../use-hash-route';

const DOC_TITLES: Record<(typeof DOC_SLUGS)[number], string> = {
  introduction: 'Introduction',
  installation: 'Installation',
  theming: 'Theming',
  cli: 'CLI',
  rtl: 'RTL & Arabic',
  migration: 'Migration',
};

const CATEGORY_TITLES: Record<string, string> = {
  foundation: 'Foundation',
  form: 'Forms',
  overlay: 'Overlays',
  navigation: 'Navigation',
  data: 'Data',
  feedback: 'Feedback',
  display: 'Display',
  layout: 'Layout',
};

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
  const components = items.filter((item) => item.type === 'ui');
  const helpers = items.filter((item) => item.type !== 'ui' && item.type !== 'block');
  return (
    <nav aria-label="Documentation" className="p-row flex flex-col gap-0.5 text-start">
      <GroupTitle first>Get started</GroupTitle>
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
            {DOC_TITLES[slug]}
          </a>
        );
      })}

      <GroupTitle>Browse</GroupTitle>
      {[
        ['All components', '#/components', route.page === 'components'],
        ['Blocks', '#/blocks', route.page === 'blocks' || route.page === 'block'],
        ['Charts', '#/charts', route.page === 'charts'],
        ['Themes', '#/themes', route.page === 'themes'],
        ['Tokens', '#/tokens', route.page === 'tokens'],
      ].map(([label, hash, active]) => (
        <a
          key={String(hash)}
          href={String(hash)}
          onClick={onNavigate}
          className={itemClass(active === true)}
          aria-current={active === true ? 'page' : undefined}
        >
          {String(label)}
        </a>
      ))}

      {CATEGORY_ORDER.map((category) => {
        const group = components.filter((item) => item.category === category);
        if (group.length === 0) {
          return null;
        }
        return (
          <div key={category} className="flex flex-col gap-0.5">
            <GroupTitle>{CATEGORY_TITLES[category] ?? category}</GroupTitle>
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

      <GroupTitle>Helpers</GroupTitle>
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

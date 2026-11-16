import { useEffect, useState } from 'react';

export type DocSlug = 'introduction' | 'installation' | 'theming' | 'cli' | 'rtl' | 'migration';
export const DOC_SLUGS: readonly DocSlug[] = [
  'introduction',
  'installation',
  'theming',
  'cli',
  'rtl',
  'migration',
];

export type Route =
  | { page: 'home' }
  | { page: 'docs'; slug: DocSlug }
  | { page: 'components' }
  | { page: 'component'; name: string }
  | { page: 'blocks' }
  | { page: 'block'; name: string }
  /** A block rendered alone, loaded inside the block previews' iframes. */
  | { page: 'preview'; name: string }
  | { page: 'charts' }
  | { page: 'themes' }
  | { page: 'tokens' };

const NAME = '([a-z0-9-]+)';

function isDocSlug(value: string): value is DocSlug {
  return DOC_SLUGS.some((slug) => slug === value);
}

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').replace(/\/$/, '');
  const simple: Record<string, Route> = {
    components: { page: 'components' },
    blocks: { page: 'blocks' },
    charts: { page: 'charts' },
    themes: { page: 'themes' },
    tokens: { page: 'tokens' },
  };
  const direct = simple[path];
  if (direct) {
    return direct;
  }
  const doc = new RegExp(`^docs/${NAME}$`).exec(path);
  if (doc?.[1] && isDocSlug(doc[1])) {
    return { page: 'docs', slug: doc[1] };
  }
  if (path === 'docs') {
    return { page: 'docs', slug: 'introduction' };
  }
  const block = new RegExp(`^blocks/${NAME}$`).exec(path);
  if (block?.[1]) {
    return { page: 'block', name: block[1] };
  }
  const preview = new RegExp(`^preview/${NAME}$`).exec(path);
  if (preview?.[1]) {
    return { page: 'preview', name: preview[1] };
  }
  const component = new RegExp(`^components/${NAME}$`).exec(path);
  if (component?.[1]) {
    return { page: 'component', name: component[1] };
  }
  return { page: 'home' };
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  useEffect(() => {
    const update = () => {
      setRoute(parseRoute(window.location.hash));
      // Each route starts at the top, like a normal page navigation.
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return route;
}

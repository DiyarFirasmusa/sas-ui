import { useEffect, useState } from 'react';

export type Route =
  | { page: 'home' }
  | { page: 'tokens' }
  | { page: 'blocks' }
  | { page: 'block'; name: string }
  /** A block rendered alone, loaded inside the block page's responsive iframe. */
  | { page: 'preview'; name: string }
  | { page: 'component'; name: string };

const NAME = '([a-z0-9-]+)';

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '');
  if (path === 'tokens') {
    return { page: 'tokens' };
  }
  if (path === 'blocks') {
    return { page: 'blocks' };
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
    const update = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return route;
}

import { useEffect, useState } from 'react';

export type Route =
  | { page: 'home' }
  | { page: 'tokens' }
  | { page: 'component'; name: string };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '');
  if (path === 'tokens') {
    return { page: 'tokens' };
  }
  const match = /^components\/([a-z0-9-]+)$/.exec(path);
  if (match?.[1]) {
    return { page: 'component', name: match[1] };
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

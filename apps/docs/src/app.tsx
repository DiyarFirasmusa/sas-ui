import { useState } from 'react';
import { cn } from '@/lib/utils';
import { DocsSidebar } from './layout/docs-sidebar';
import { OnThisPage } from './layout/on-this-page';
import { SearchDialog } from './layout/search-dialog';
import { SiteHeader } from './layout/site-header';
import { BlockPage } from './pages/block-page';
import { BlocksPage } from './pages/blocks-page';
import { ChartsPage } from './pages/charts-page';
import { ComponentPage } from './pages/component-page';
import { ComponentsPage } from './pages/components-page';
import { DocsPage } from './pages/docs-page';
import { HomePage } from './pages/home-page';
import { PreviewPage } from './pages/preview-page';
import { ThemesPage } from './pages/themes-page';
import { TokensPage } from './pages/tokens-page';
import { useHashRoute, type Route } from './use-hash-route';

/** Pages that show the docs sidebar and the "On this page" column. */
function usesDocsLayout(route: Route): boolean {
  return route.page === 'docs' || route.page === 'component' || route.page === 'components';
}

function routeKey(route: Route): string {
  return 'name' in route
    ? `${route.page}:${route.name}`
    : route.page === 'docs'
      ? `docs:${route.slug}`
      : route.page;
}

export function App() {
  const route = useHashRoute();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  if (route.page === 'preview') {
    return <PreviewPage key={route.name} name={route.name} />;
  }
  const docsLayout = usesDocsLayout(route);
  return (
    <div className="bg-background text-foreground min-h-screen">
      <SiteHeader
        route={route}
        onMenu={() => setMenuOpen((open) => !open)}
        onSearch={() => setSearchOpen(true)}
      />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <div className="mx-auto flex max-w-[100rem]">
        {docsLayout ? (
          <aside
            className={cn(
              'sticky top-14 h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-e border-stroke-subtle bg-background',
              'max-lg:fixed max-lg:inset-y-14 max-lg:start-0 max-lg:z-20 max-lg:border-e max-lg:shadow-xlarge',
              menuOpen ? 'max-lg:block' : 'max-lg:hidden',
            )}
          >
            <DocsSidebar route={route} onNavigate={() => setMenuOpen(false)} />
          </aside>
        ) : null}
        <main className="px-row py-card md:px-page min-w-0 flex-1">
          {route.page === 'home' ? <HomePage /> : null}
          {route.page === 'docs' ? <DocsPage slug={route.slug} /> : null}
          {route.page === 'components' ? <ComponentsPage /> : null}
          {route.page === 'component' ? <ComponentPage key={route.name} name={route.name} /> : null}
          {route.page === 'blocks' ? <BlocksPage /> : null}
          {route.page === 'block' ? <BlockPage key={route.name} name={route.name} /> : null}
          {route.page === 'charts' ? <ChartsPage /> : null}
          {route.page === 'themes' ? <ThemesPage /> : null}
          {route.page === 'tokens' ? <TokensPage /> : null}
        </main>
        {docsLayout ? (
          <aside className="py-card pe-row sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto xl:block">
            <OnThisPage watch={routeKey(route)} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}

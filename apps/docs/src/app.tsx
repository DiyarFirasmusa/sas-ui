import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BlockPage, BlocksPage } from './pages/block-page';
import { ComponentPage } from './pages/component-page';
import { HomePage } from './pages/home-page';
import { PreviewPage } from './pages/preview-page';
import { TokensPage } from './pages/tokens-page';
import { SidebarNav } from './sidebar-nav';
import { Toolbar } from './toolbar';
import { useHashRoute } from './use-hash-route';

export function App() {
  const route = useHashRoute();
  if (route.page === 'preview') {
    return <PreviewPage key={route.name} name={route.name} />;
  }
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Toolbar onMenu={() => setMenuOpen((open) => !open)} />
      <div className="flex">
        <aside
          className={cn(
            'sticky top-[57px] h-[calc(100vh-57px)] w-64 shrink-0 overflow-y-auto border-e border-stroke bg-sidebar text-sidebar-foreground',
            'max-lg:fixed max-lg:z-20 max-lg:start-0',
            menuOpen ? 'max-lg:block' : 'max-lg:hidden',
          )}
        >
          <SidebarNav route={route} onNavigate={() => setMenuOpen(false)} />
        </aside>
        <main className="p-row md:p-card min-w-0 flex-1">
          {route.page === 'home' ? <HomePage /> : null}
          {route.page === 'tokens' ? <TokensPage /> : null}
          {route.page === 'blocks' ? <BlocksPage /> : null}
          {route.page === 'block' ? <BlockPage key={route.name} name={route.name} /> : null}
          {route.page === 'component' ? <ComponentPage key={route.name} name={route.name} /> : null}
        </main>
      </div>
    </div>
  );
}

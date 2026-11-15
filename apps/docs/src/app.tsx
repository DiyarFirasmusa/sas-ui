import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SidebarNav } from './sidebar-nav';
import { Toolbar } from './toolbar';
import { useHashRoute } from './use-hash-route';
import { ComponentPage } from './pages/component-page';
import { HomePage } from './pages/home-page';
import { TokensPage } from './pages/tokens-page';

export function App() {
  const route = useHashRoute();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
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
        <main className="min-w-0 flex-1 p-row md:p-card">
          {route.page === 'home' ? <HomePage /> : null}
          {route.page === 'tokens' ? <TokensPage /> : null}
          {route.page === 'component' ? <ComponentPage key={route.name} name={route.name} /> : null}
        </main>
      </div>
    </div>
  );
}

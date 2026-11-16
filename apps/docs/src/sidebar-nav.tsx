import { cn } from '@/lib/utils';
import { blocks, itemsByCategory } from './catalog';
import type { Route } from './use-hash-route';

function link(active: boolean) {
  return cn(
    'block rounded-md px-inline py-1.5 text-b2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
    active &&
      'bg-sidebar-selected font-semibold text-sidebar-selected-foreground hover:bg-sidebar-selected hover:text-sidebar-selected-foreground',
  );
}

export function SidebarNav({ route, onNavigate }: { route: Route; onNavigate: () => void }) {
  return (
    <nav aria-label="Documentation" className="gap-row p-row flex flex-col">
      <div className="flex flex-col gap-1">
        <a
          href="#/"
          onClick={onNavigate}
          className={link(route.page === 'home')}
          aria-current={route.page === 'home' ? 'page' : undefined}
        >
          Getting started
        </a>
        <a
          href="#/tokens"
          onClick={onNavigate}
          className={link(route.page === 'tokens')}
          aria-current={route.page === 'tokens' ? 'page' : undefined}
        >
          Tokens & presets
        </a>
        <a
          href="#/blocks"
          onClick={onNavigate}
          className={link(route.page === 'blocks')}
          aria-current={route.page === 'blocks' ? 'page' : undefined}
        >
          All blocks
        </a>
      </div>
      {blocks.length > 0 ? (
        <div className="flex flex-col gap-1">
          <h2 className="px-inline text-label text-sidebar-foreground/70">Blocks</h2>
          {blocks.map((block) => {
            const active = route.page === 'block' && route.name === block.name;
            return (
              <a
                key={block.name}
                href={`#/blocks/${block.name}`}
                onClick={onNavigate}
                dir="auto"
                className={link(active)}
                aria-current={active ? 'page' : undefined}
              >
                {block.title}
              </a>
            );
          })}
        </div>
      ) : null}
      {itemsByCategory().map((group) => (
        <div key={group.category} className="flex flex-col gap-1">
          <h2 className="px-inline text-label text-sidebar-foreground/70 capitalize">
            {group.category}
          </h2>
          {group.items.map((item) => {
            const active = route.page === 'component' && route.name === item.name;
            return (
              <a
                key={item.name}
                href={`#/components/${item.name}`}
                onClick={onNavigate}
                dir="auto"
                className={link(active)}
                aria-current={active ? 'page' : undefined}
              >
                {item.title}
              </a>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

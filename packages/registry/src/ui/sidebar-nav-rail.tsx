import { useSidebar } from '@/components/ui/sidebar';
import {
  containsActive,
  FOCUS_RING,
  TOP_ACTIVE,
  TOP_IDLE,
  type NavContext,
} from '@/components/ui/sidebar-nav-items';
import { SidebarRailTooltip } from '@/components/ui/sidebar-rail-tooltip';
import { totalBadge, type NavItem } from '@/lib/nav-utils';
import { cn } from '@/lib/utils';

/**
 * Icon-only entry of the collapsed rail, with a name tooltip on the inline-end
 * side: a link, or — for a group — a button that expands the sidebar and
 * opens that group.
 */
function SidebarNavRailItem({ item, context }: { item: NavItem; context: NavContext }) {
  const sidebar = useSidebar();
  const active = context.activeId === item.id || containsActive(item, context.activeId);
  const pending = totalBadge(item) > 0;
  const className = cn(
    'relative flex size-11 shrink-0 items-center justify-center rounded-xl border border-transparent transition-colors',
    FOCUS_RING,
    active ? TOP_ACTIVE : TOP_IDLE,
    item.disabled && 'pointer-events-none opacity-50',
  );
  const content = (
    <>
      <span className="flex size-5 items-center justify-center [&>svg]:size-5">{item.icon}</span>
      {pending ? (
        <span
          aria-hidden="true"
          data-slot="sidebar-badge-dot"
          className="bg-primary absolute end-1 top-1 size-2 rounded-full"
        />
      ) : null}
    </>
  );
  const hasChildren = item.children !== undefined && item.children.length > 0;

  return (
    <li>
      <SidebarRailTooltip label={item.label}>
        {hasChildren || item.href === undefined ? (
          <button
            type="button"
            aria-label={item.label}
            disabled={item.disabled}
            className={className}
            onClick={() => {
              context.onOpen(item.id);
              sidebar.setCollapsed(false);
            }}
          >
            {content}
          </button>
        ) : (
          context.renderLink(
            {
              href: item.href,
              'aria-label': item.label,
              'aria-current': active ? (context.exactActive ? 'page' : 'location') : undefined,
              className,
              onClick: () => {
                context.onNavigate(item);
              },
              children: content,
            },
            item,
          )
        )}
      </SidebarRailTooltip>
    </li>
  );
}

export { SidebarNavRailItem };

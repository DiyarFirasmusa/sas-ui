import { Collapsible } from '@base-ui/react/collapsible';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { ChevronDownIcon } from '@/components/ui/icons';
import { useSidebar } from '@/components/ui/sidebar';
import { useLabels, type Messages } from '@/lib/locale';
import {
  ancestorIds,
  findActiveId,
  flattenNavItems,
  formatBadge,
  initialExpandedIds,
  normalizePath,
  toggleExpanded,
  totalBadge,
  type NavItem,
} from '@/lib/nav-utils';
import { cn } from '@/lib/utils';

const messages: Messages<'navigation' | 'toggleGroup'> = {
  en: { navigation: 'Main navigation', toggleGroup: 'Toggle' },
  ar: { navigation: 'التنقل الرئيسي', toggleGroup: 'تبديل' },
};

/** Props for the anchor a nav link renders; hand them to your router's `Link`. */
type NavLinkProps = ComponentProps<'a'> & { href: string };

type RenderNavLink = (props: NavLinkProps, item: NavItem) => ReactNode;

const defaultRenderLink: RenderNavLink = ({ children, ...props }) => <a {...props}>{children}</a>;

const ROW =
  'flex w-full min-w-0 items-center gap-inline rounded-control px-inline text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring';
const IDLE =
  'text-b1 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground';
const ACTIVE = 'text-button-1 bg-sidebar-selected text-sidebar-selected-foreground';
const DISABLED = 'pointer-events-none opacity-50';

interface NavContext {
  activeId: string | null;
  exactActive: boolean;
  expanded: readonly string[];
  renderLink: RenderNavLink;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  onNavigate: (item: NavItem) => void;
  toggleLabel: string;
}

/** True when the active item is somewhere below `item`. */
function containsActive(item: NavItem, activeId: string | null): boolean {
  return (
    activeId !== null && flattenNavItems(item.children ?? []).some((child) => child.id === activeId)
  );
}

function Badge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) {
    return null;
  }
  return (
    <span
      data-slot="sidebar-badge"
      className={cn(
        'inline-flex min-w-5 shrink-0 items-center justify-center rounded-pill bg-primary px-1.5 text-label text-primary-foreground tabular-nums',
        className,
      )}
    >
      {formatBadge(count)}
    </span>
  );
}

function RowContent({ item, count }: { item: NavItem; count: number }) {
  return (
    <>
      {item.icon ? (
        <span className="flex size-5 shrink-0 items-center justify-center">{item.icon}</span>
      ) : null}
      <span dir="auto" className="min-w-0 flex-1 truncate">
        {item.label}
      </span>
      <Badge count={count} />
    </>
  );
}

function ItemLink({ item, depth, context }: { item: NavItem; depth: number; context: NavContext }) {
  const active = context.activeId === item.id;
  const className = cn(
    ROW,
    depth === 0 ? 'min-h-11' : 'min-h-9 text-b2',
    active ? ACTIVE : IDLE,
    item.disabled && DISABLED,
  );
  if (item.href === undefined || item.disabled) {
    return (
      <span aria-disabled={item.disabled || undefined} className={className}>
        <RowContent item={item} count={item.badge ?? 0} />
      </span>
    );
  }
  return context.renderLink(
    {
      href: item.href,
      className,
      'aria-current': active ? (context.exactActive ? 'page' : 'location') : undefined,
      onClick: () => {
        context.onNavigate(item);
      },
      children: <RowContent item={item} count={item.badge ?? 0} />,
    },
    item,
  );
}

function ItemGroup({
  item,
  depth,
  context,
}: {
  item: NavItem;
  depth: number;
  context: NavContext;
}) {
  const open = context.expanded.includes(item.id);
  const holdsActive = containsActive(item, context.activeId);
  const count = open ? (item.badge ?? 0) : totalBadge(item);
  const triggerClass = cn(
    ROW,
    depth === 0 ? 'min-h-11' : 'min-h-9 text-b2',
    IDLE,
    holdsActive && !open && 'bg-sidebar-accent text-sidebar-accent-foreground',
  );
  const chevron = (
    <ChevronDownIcon
      className={cn(
        'shrink-0 transition-transform duration-200 motion-reduce:transition-none',
        open && 'rotate-180',
      )}
    />
  );

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={() => {
        context.onToggle(item.id);
      }}
      className="flex flex-col gap-1"
    >
      {item.href !== undefined && !item.disabled ? (
        <div className="flex items-center gap-1">
          <div className="min-w-0 flex-1">
            <ItemLink item={{ ...item, badge: count }} depth={depth} context={context} />
          </div>
          <Collapsible.Trigger
            aria-label={`${context.toggleLabel} ${item.label}`}
            className="rounded-control text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring inline-flex size-9 shrink-0 items-center justify-center transition-colors outline-none focus-visible:ring-2"
          >
            {chevron}
          </Collapsible.Trigger>
        </div>
      ) : (
        <Collapsible.Trigger
          disabled={item.disabled}
          className={cn(triggerClass, item.disabled && DISABLED)}
        >
          <RowContent item={item} count={count} />
          {chevron}
        </Collapsible.Trigger>
      )}
      <Collapsible.Panel className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 data-[ending-style]:h-0 data-[starting-style]:h-0 motion-reduce:transition-none">
        <ul className="border-sidebar-border ms-5 flex flex-col gap-1 border-s ps-1">
          {(item.children ?? []).map((child) => (
            <NavNode key={child.id} item={child} depth={depth + 1} context={context} />
          ))}
        </ul>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

function NavNode({ item, depth, context }: { item: NavItem; depth: number; context: NavContext }) {
  return (
    <li>
      {item.children && item.children.length > 0 ? (
        <ItemGroup item={item} depth={depth} context={context} />
      ) : (
        <ItemLink item={item} depth={depth} context={context} />
      )}
    </li>
  );
}

/** Icon-only entry of the collapsed rail: a link, or a group that expands the sidebar. */
function RailNode({ item, context }: { item: NavItem; context: NavContext }) {
  const sidebar = useSidebar();
  const active = context.activeId === item.id || containsActive(item, context.activeId);
  const count = totalBadge(item);
  const className = cn(
    'relative flex size-11 items-center justify-center rounded-control outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring',
    active ? ACTIVE : IDLE,
    item.disabled && DISABLED,
  );
  const content = (
    <>
      <span className="flex size-5 items-center justify-center">{item.icon}</span>
      {count > 0 ? (
        <span aria-hidden="true" className="bg-primary absolute end-1 top-1 size-2 rounded-full" />
      ) : null}
    </>
  );
  const hasChildren = item.children !== undefined && item.children.length > 0;

  return (
    <li>
      {hasChildren || item.href === undefined ? (
        <button
          type="button"
          title={item.label}
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
            title: item.label,
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
    </li>
  );
}

interface SidebarNavProps extends Omit<ComponentProps<'nav'>, 'children'> {
  /** The tree to show. Filter out what the user may not see before passing it. */
  items: readonly NavItem[];
  /** Current location, used to find the active item by `href` / `matches`. Defaults to `location.pathname`. */
  currentPath?: string;
  /** Decide activity yourself (e.g. from your router). Takes precedence over `currentPath`. */
  isActive?: (item: NavItem) => boolean;
  /** Render each link with your router's `Link`: `(props, item) => <Link to={props.href} {...rest} />`. */
  renderLink?: RenderNavLink;
  /** Opening a group closes its siblings. */
  accordion?: boolean;
  expanded?: readonly string[];
  defaultExpanded?: readonly string[];
  onExpandedChange?: (expanded: string[]) => void;
  /** Called when a link is followed (the mobile drawer also closes). */
  onNavigate?: (item: NavItem) => void;
}

/**
 * Data-driven navigation: links, and groups that expand. Active state follows
 * `currentPath`/`isActive` and keeps the active branch open. In a collapsed
 * sidebar it shows icons only; pressing a group icon expands the sidebar.
 */
function SidebarNav({
  items,
  currentPath,
  isActive,
  renderLink = defaultRenderLink,
  accordion = false,
  expanded: expandedProp,
  defaultExpanded,
  onExpandedChange,
  onNavigate,
  className,
  'aria-label': ariaLabel,
  ...props
}: SidebarNavProps) {
  const labels = useLabels(messages);
  const sidebar = useSidebar();
  const path = normalizePath(currentPath ?? globalThis.location?.pathname ?? '/');
  const customActive = isActive ? flattenNavItems(items).find((item) => isActive(item)) : undefined;
  const activeId = isActive ? (customActive?.id ?? null) : findActiveId(items, path);

  const [internal, setInternal] = useState<string[]>(() => [
    ...new Set([...(defaultExpanded ?? []), ...initialExpandedIds(items, path)]),
  ]);
  const expanded = expandedProp ?? internal;

  function commit(next: string[]) {
    if (expandedProp === undefined) {
      setInternal(next);
    }
    onExpandedChange?.(next);
  }

  // Following a link (or the route changing elsewhere) opens the branch it lives in.
  useEffect(() => {
    if (activeId === null) {
      return;
    }
    const missing = ancestorIds(items, activeId).filter((id) => !expanded.includes(id));
    if (missing.length > 0) {
      commit([...expanded, ...missing]);
    }
    // Only a change of the active item should re-open its branch; manual closes stay closed.
  }, [activeId]);

  const activeItem = flattenNavItems(items).find((item) => item.id === activeId);
  const context: NavContext = {
    activeId,
    exactActive:
      Boolean(activeItem?.href && normalizePath(activeItem.href) === path) ||
      isActive !== undefined,
    expanded,
    renderLink,
    toggleLabel: labels.toggleGroup,
    onToggle: (id) => {
      commit(toggleExpanded(items, expanded, id, { single: accordion }));
    },
    onOpen: (id) => {
      if (!expanded.includes(id)) {
        commit(toggleExpanded(items, expanded, id, { single: accordion }));
      }
    },
    onNavigate: (item) => {
      onNavigate?.(item);
      sidebar.closeMobile();
    },
  };

  return (
    <nav
      data-slot="sidebar-nav"
      aria-label={ariaLabel ?? labels.navigation}
      className={cn('flex flex-col', className)}
      {...props}
    >
      <ul className={cn('flex flex-col gap-1', sidebar.collapsed && 'items-center')}>
        {sidebar.collapsed
          ? items.map((item) => <RailNode key={item.id} item={item} context={context} />)
          : items.map((item) => <NavNode key={item.id} item={item} depth={0} context={context} />)}
      </ul>
    </nav>
  );
}

export { SidebarNav };
export type { NavLinkProps, RenderNavLink, SidebarNavProps };

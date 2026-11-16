import { useEffect, useId, useState, type ComponentProps } from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import {
  NavNode,
  type NavContext,
  type NavLinkProps,
  type RenderNavLink,
} from '@/components/ui/sidebar-nav-items';
import { SidebarNavRailItem } from '@/components/ui/sidebar-nav-rail';
import { useLabels, type Messages } from '@/lib/locale';
import {
  ancestorIds,
  findActiveId,
  flattenNavItems,
  initialExpandedIds,
  normalizePath,
  splitPinned,
  toggleExpanded,
  toNavSections,
  type NavItem,
  type NavSection,
} from '@/lib/nav-utils';
import { cn } from '@/lib/utils';

const messages: Messages<'navigation' | 'toggleGroup'> = {
  en: { navigation: 'Main navigation', toggleGroup: 'Toggle' },
  ar: { navigation: 'التنقل الرئيسي', toggleGroup: 'تبديل' },
};

const defaultRenderLink: RenderNavLink = ({ children, ...props }) => <a {...props}>{children}</a>;

/** One labelled run of links in the flat (`hr`) layout. */
function FlatSection({ section, context }: { section: NavSection; context: NavContext }) {
  const headingId = useId();
  return (
    <div className="flex flex-col gap-3">
      {section.label ? (
        <p id={headingId} dir="auto" className="px-field text-b3 text-sidebar-foreground/70">
          {section.label}
        </p>
      ) : null}
      <ul aria-labelledby={section.label ? headingId : undefined} className="flex flex-col gap-3">
        {section.items.map((item) => (
          <NavNode key={item.id} item={item} depth={0} context={context} />
        ))}
      </ul>
    </div>
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
 * Data-driven navigation. In the default layout: links and accordion groups
 * (header row with an icon, nested links with a start rule), the active branch
 * kept open, `pinned` entries at the bottom under a divider. In the `hr`
 * layout the groups become flat sections under small headings. In a collapsed
 * sidebar it shows icons only, each with a tooltip; pressing a group icon
 * expands the sidebar.
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
    layout: sidebar.layout,
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

  const { main, pinned } = splitPinned(items);
  const rail = sidebar.collapsed && sidebar.layout !== 'hr';
  const navProps = {
    'data-slot': 'sidebar-nav',
    'aria-label': ariaLabel ?? labels.navigation,
    ...props,
  };

  if (rail) {
    return (
      <nav {...navProps} className={cn('flex min-h-full flex-1 flex-col', className)}>
        <ul className="flex flex-col items-center gap-2">
          {main.map((item) => (
            <SidebarNavRailItem key={item.id} item={item} context={context} />
          ))}
        </ul>
        {pinned.length > 0 ? (
          <ul className="border-sidebar-border mt-auto flex flex-col items-center gap-2 border-t pt-2">
            {pinned.map((item) => (
              <SidebarNavRailItem key={item.id} item={item} context={context} />
            ))}
          </ul>
        ) : null}
      </nav>
    );
  }

  if (sidebar.layout === 'hr') {
    return (
      <nav {...navProps} className={cn('flex min-h-full flex-1 flex-col gap-6', className)}>
        {toNavSections(main).map((section) => (
          <FlatSection key={section.id} section={section} context={context} />
        ))}
        {pinned.length > 0 ? (
          <div className="border-sidebar-border pt-row mt-auto flex flex-col gap-6 border-t">
            {toNavSections(pinned).map((section) => (
              <FlatSection key={section.id} section={section} context={context} />
            ))}
          </div>
        ) : null}
      </nav>
    );
  }

  return (
    <nav {...navProps} className={cn('flex min-h-full flex-1 flex-col gap-row', className)}>
      <ul className="gap-row flex flex-col">
        {main.map((item) => (
          <NavNode key={item.id} item={item} depth={0} context={context} />
        ))}
      </ul>
      {pinned.length > 0 ? (
        <ul className="gap-row border-sidebar-border pt-row mt-auto flex flex-col border-t">
          {pinned.map((item) => (
            <NavNode key={item.id} item={item} depth={0} context={context} />
          ))}
        </ul>
      ) : null}
    </nav>
  );
}

export { SidebarNav };
export type { NavLinkProps, RenderNavLink, SidebarNavProps };

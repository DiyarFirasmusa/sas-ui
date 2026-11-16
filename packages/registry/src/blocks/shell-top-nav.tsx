import type { ComponentProps, ReactElement } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon } from '@/components/ui/icons';
import type { NavLinkProps } from '@/components/ui/sidebar-nav';
import { useLabels, type Messages } from '@/lib/locale';
import { findActiveId, flattenNavItems, normalizePath, type NavItem } from '@/lib/nav-utils';
import { cn } from '@/lib/utils';

const messages: Messages<'navigation'> = {
  en: { navigation: 'Main navigation' },
  ar: { navigation: 'التنقل الرئيسي' },
};

const LINK =
  'text-button-1 text-text-secondary hover:bg-hover-row hover:text-text-primary focus-visible:ring-ring rounded-control inline-flex h-9.5 items-center gap-1 px-inline whitespace-nowrap outline-none focus-visible:ring-2 data-[popup-open]:bg-hover-row';
const CURRENT = 'text-primary-text bg-primary-light hover:bg-primary-light';

/**
 * Renders one link; hand `props` to your router's `Link` so navigation stays client-side.
 * Spread the props as they come: dropdown entries receive no `children` of their own.
 */
type ShellRenderLink = (props: NavLinkProps, item: NavItem) => ReactElement;

const defaultRenderLink: ShellRenderLink = (props) => <a {...props} />;

interface ShellTopNavProps extends Omit<ComponentProps<'nav'>, 'children'> {
  items: readonly NavItem[];
  /** Current location; the item that owns it is marked as the current page. */
  currentPath?: string;
  /** Called when a link is followed; use it to drive your router. */
  onNavigate?: (item: NavItem) => void;
  renderLink?: ShellRenderLink;
}

function containsId(item: NavItem, id: string | null): boolean {
  return id !== null && flattenNavItems(item.children ?? []).some((child) => child.id === id);
}

/** Entries of a dropdown: links, and groups that open a submenu to the inline end. */
function MenuEntries({
  items,
  activeId,
  onNavigate,
  renderLink,
}: {
  items: readonly NavItem[];
  activeId: string | null;
  onNavigate?: (item: NavItem) => void;
  renderLink: ShellRenderLink;
}) {
  return items.map((item) =>
    item.children && item.children.length > 0 ? (
      <DropdownMenuSub key={item.id}>
        <DropdownMenuSubTrigger>{item.label}</DropdownMenuSubTrigger>
        <DropdownMenuContent side="inline-end" align="start" sideOffset={2}>
          <MenuEntries
            items={item.children}
            activeId={activeId}
            onNavigate={onNavigate}
            renderLink={renderLink}
          />
        </DropdownMenuContent>
      </DropdownMenuSub>
    ) : (
      <DropdownMenuItem
        key={item.id}
        disabled={item.disabled}
        render={
          item.href === undefined
            ? undefined
            : renderLink(
                {
                  href: item.href,
                  'aria-current': item.id === activeId ? 'page' : undefined,
                },
                item,
              )
        }
        onClick={() => onNavigate?.(item)}
        className={cn(item.id === activeId && 'text-primary-text')}
      >
        {item.label}
      </DropdownMenuItem>
    ),
  );
}

/**
 * Horizontal navigation for a top-bar layout. A plain item is a link; an item
 * with children is a button that opens a dropdown of them (nested groups open
 * submenus). Arrow keys, Escape and focus return come from the menu primitive.
 */
function ShellTopNav({
  items,
  currentPath,
  onNavigate,
  renderLink = defaultRenderLink,
  className,
  'aria-label': ariaLabel,
  ...props
}: ShellTopNavProps) {
  const labels = useLabels(messages);
  const path = normalizePath(currentPath ?? globalThis.location?.pathname ?? '/');
  const activeId = findActiveId(items, path);

  return (
    <nav
      data-slot="shell-top-nav"
      aria-label={ariaLabel ?? labels.navigation}
      className={className}
      {...props}
    >
      <ul className="gap-field flex items-center">
        {items.map((item) => {
          const current = item.id === activeId || containsId(item, activeId);
          return (
            <li key={item.id}>
              {item.children && item.children.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    disabled={item.disabled}
                    className={cn(LINK, current && CURRENT)}
                  >
                    {item.label}
                    <ChevronDownIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <MenuEntries
                      items={item.children}
                      activeId={activeId}
                      onNavigate={onNavigate}
                      renderLink={renderLink}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : item.href === undefined || item.disabled ? (
                <span aria-disabled="true" className={cn(LINK, 'pointer-events-none opacity-50')}>
                  {item.label}
                </span>
              ) : (
                renderLink(
                  {
                    href: item.href,
                    'aria-current': current ? 'page' : undefined,
                    onClick: () => onNavigate?.(item),
                    className: cn(LINK, current && CURRENT),
                    children: item.label,
                  },
                  item,
                )
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { ShellTopNav };
export type { ShellRenderLink, ShellTopNavProps };

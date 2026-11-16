import { Collapsible } from '@base-ui/react/collapsible';
import type { ComponentProps, ReactNode } from 'react';
import { ChevronDownIcon } from '@/components/ui/icons';
import type { SidebarLayout } from '@/components/ui/sidebar';
import { flattenNavItems, formatBadge, totalBadge, type NavItem } from '@/lib/nav-utils';
import { cn } from '@/lib/utils';

/** Props for the anchor a nav link renders; hand them to your router's `Link`. */
type NavLinkProps = ComponentProps<'a'> & { href: string };

type RenderNavLink = (props: NavLinkProps, item: NavItem) => ReactNode;

/** What every row of the navigation needs to know; built once by `SidebarNav`. */
interface NavContext {
  layout: SidebarLayout;
  activeId: string | null;
  exactActive: boolean;
  expanded: readonly string[];
  renderLink: RenderNavLink;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  onNavigate: (item: NavItem) => void;
  toggleLabel: string;
}

const FOCUS_RING =
  'outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sidebar-ring';
const HOVER = 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground';

const ROW = `flex min-w-0 items-center border border-transparent transition-colors ${FOCUS_RING}`;
/** Top-level row of the default layout: 44px, 16px radius, icon + label. */
const TOP_ROW = `${ROW} h-11 gap-3 rounded-xl px-3 text-start`;
const TOP_IDLE = `text-b1 text-sidebar-foreground ${HOVER}`;
const TOP_ACTIVE = 'text-h5 bg-sidebar-selected text-sidebar-selected-foreground';
/** Link inside an expanded group: 36px, a bar marks the current page. */
const NESTED_ROW = `${ROW} relative h-9 gap-2 rounded-lg ps-4 pe-3 text-start`;
const NESTED_IDLE = `text-b2 text-sidebar-foreground/70 ${HOVER}`;
const NESTED_ACTIVE = 'text-button-2 text-sidebar-foreground';
/** Row of the `hr` layout: 40px, flat, the current page takes the accent. */
const FLAT_ROW = `${ROW} h-10 gap-field rounded-md p-field text-start`;
const FLAT_IDLE = `text-h5 text-sidebar-foreground ${HOVER}`;
const FLAT_ACTIVE = 'text-h5 bg-sidebar-accent text-sidebar-accent-foreground';
const DISABLED = 'pointer-events-none opacity-50';

/** True when the active item is somewhere below `item`. */
function containsActive(item: NavItem, activeId: string | null): boolean {
  return (
    activeId !== null && flattenNavItems(item.children ?? []).some((child) => child.id === activeId)
  );
}

function rowClasses(context: NavContext, depth: number, active: boolean): string {
  if (context.layout === 'hr') {
    return cn(FLAT_ROW, active ? FLAT_ACTIVE : FLAT_IDLE);
  }
  if (depth === 0) {
    return cn(TOP_ROW, active ? TOP_ACTIVE : TOP_IDLE);
  }
  return cn(NESTED_ROW, active ? NESTED_ACTIVE : NESTED_IDLE);
}

function CountBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }
  return (
    <span
      data-slot="sidebar-badge"
      className="rounded-pill bg-primary text-label text-primary-foreground inline-flex min-w-5 shrink-0 items-center justify-center px-1.5 tabular-nums"
    >
      {formatBadge(count)}
    </span>
  );
}

function RowContent({ item, count, depth }: { item: NavItem; count: number; depth: number }) {
  return (
    <>
      {item.icon && depth === 0 ? (
        <span className="flex size-5 shrink-0 items-center justify-center [&>svg]:size-5">
          {item.icon}
        </span>
      ) : null}
      <span dir="auto" className="min-w-0 flex-1 truncate">
        {item.label}
      </span>
      <CountBadge count={count} />
    </>
  );
}

function CurrentBar({ show }: { show: boolean }) {
  return show ? (
    <span
      aria-hidden="true"
      className="rounded-pill bg-sidebar-foreground absolute inset-y-1 -start-px w-0.5"
    />
  ) : null;
}

function ItemLink({ item, depth, context }: { item: NavItem; depth: number; context: NavContext }) {
  const active = context.activeId === item.id;
  const className = cn(rowClasses(context, depth, active), item.disabled && DISABLED);
  const nestedBar = context.layout !== 'hr' && depth > 0;
  if (item.href === undefined || item.disabled) {
    return (
      <span aria-disabled={item.disabled || undefined} className={className}>
        <CurrentBar show={nestedBar && active} />
        <RowContent item={item} count={item.badge ?? 0} depth={depth} />
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
      children: (
        <>
          <CurrentBar show={nestedBar && active} />
          <RowContent item={item} count={item.badge ?? 0} depth={depth} />
        </>
      ),
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
  const count = open ? (item.badge ?? 0) : totalBadge(item);
  const headerClass = cn(
    rowClasses(context, depth, false),
    // An open group reads as the selected parent: heavier label on a tinted row.
    open && depth === 0 && 'text-h5',
  );
  const chevron = (
    <ChevronDownIcon
      className={cn(
        'shrink-0 text-sidebar-foreground/70 transition-transform duration-200 ease-out motion-reduce:transition-none',
        open && 'rotate-180',
      )}
    />
  );
  const tint = open && depth === 0 && context.layout !== 'hr' ? 'bg-sidebar-accent' : undefined;

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={() => {
        context.onToggle(item.id);
      }}
      className="flex flex-col gap-1"
    >
      {item.href !== undefined && !item.disabled ? (
        <div className={cn('flex items-center rounded-xl', tint)}>
          <div className="min-w-0 flex-1">
            <ItemLink item={{ ...item, badge: count }} depth={depth} context={context} />
          </div>
          <Collapsible.Trigger
            aria-label={`${context.toggleLabel} ${item.label}`}
            className={cn(
              'inline-flex h-11 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
              HOVER,
              FOCUS_RING,
            )}
          >
            {chevron}
          </Collapsible.Trigger>
        </div>
      ) : (
        <Collapsible.Trigger
          disabled={item.disabled}
          className={cn(headerClass, 'w-full', tint, item.disabled && DISABLED)}
        >
          <RowContent item={item} count={count} depth={depth} />
          {chevron}
        </Collapsible.Trigger>
      )}
      <Collapsible.Panel className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 data-[ending-style]:h-0 data-[starting-style]:h-0 motion-reduce:transition-none">
        <ul className="border-sidebar-border ms-[22px] flex flex-col gap-1 border-s">
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

export { containsActive, CountBadge, FOCUS_RING, HOVER, ItemLink, NavNode, TOP_ACTIVE, TOP_IDLE };
export type { NavContext, NavLinkProps, RenderNavLink };

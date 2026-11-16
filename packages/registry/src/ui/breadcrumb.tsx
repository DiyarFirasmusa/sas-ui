import { useRender } from '@base-ui/react/use-render';
import { Fragment } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontalIcon } from '@/components/ui/icons';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'breadcrumb' | 'more'> = {
  en: { breadcrumb: 'Breadcrumb', more: 'More pages' },
  ar: { breadcrumb: 'مسار التنقل', more: 'المزيد من الصفحات' },
};

interface BreadcrumbProps extends React.ComponentProps<'nav'> {
  /** Accessible name of the landmark. Defaults to "Breadcrumb" / "مسار التنقل". */
  label?: string;
}

function Breadcrumb({ label, ...props }: BreadcrumbProps) {
  const labels = useLabels(messages, label ? { breadcrumb: label } : undefined);
  return <nav data-slot="breadcrumb" aria-label={labels.breadcrumb} {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<'ol'>) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn('flex flex-wrap items-center gap-field text-b3 text-warning', className)}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn('inline-flex items-center gap-field', className)}
      {...props}
    />
  );
}

/** A link to an ancestor page. Use `render` to hand it to your router's link. */
function BreadcrumbLink({ className, render, ...props }: useRender.ComponentProps<'a'>) {
  return useRender({
    defaultTagName: 'a',
    render,
    props: {
      'data-slot': 'breadcrumb-link',
      className: cn(
        'rounded-sm transition-colors outline-none hover:text-primary-text',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-highlight',
        'motion-reduce:transition-none',
        className,
      ),
      ...props,
    },
  });
}

/** The current page: not a link, announced as the current location. */
function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      className={cn('font-medium', className)}
      {...props}
    />
  );
}

/** The "/" between items, in the trail's colour. Pass children to use another glyph. */
function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn('inline-flex items-center', className)}
      {...props}
    >
      {children ?? '/'}
    </li>
  );
}

interface BreadcrumbEllipsisProps {
  /** The hidden middle pages. */
  items: BreadcrumbTrailItem[];
  /** Accessible name of the ellipsis button. */
  label?: string;
}

/** "…" button that lists the collapsed pages in a menu. */
function BreadcrumbEllipsis({ items, label }: BreadcrumbEllipsisProps) {
  const labels = useLabels(messages, label ? { more: label } : undefined);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-slot="breadcrumb-ellipsis"
        aria-label={labels.more}
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-md transition-colors outline-none hover:bg-hover-row hover:text-primary-text',
          'focus-visible:outline-2 focus-visible:outline-primary-highlight motion-reduce:transition-none',
          'data-[popup-open]:bg-hover-row',
        )}
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {items.map((item) => (
          <DropdownMenuItem
            key={`${item.label}-${item.href ?? ''}`}
            render={<a href={item.href} />}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface BreadcrumbTrailItem {
  label: string;
  href?: string;
}

interface BreadcrumbTrailProps extends Omit<BreadcrumbProps, 'children'> {
  /** The whole trail, root first. The last entry is the current page. */
  items: BreadcrumbTrailItem[];
  /** Collapse the middle once the trail is longer than this. Default 4. */
  maxItems?: number;
  /** Items kept before the ellipsis. Default 1. */
  itemsBeforeCollapse?: number;
  /** Items kept after the ellipsis. Default 2. */
  itemsAfterCollapse?: number;
  /** Accessible name of the ellipsis button. */
  moreLabel?: string;
}

type TrailEntry =
  | { kind: 'item'; item: BreadcrumbTrailItem; current: boolean }
  | { kind: 'collapsed'; items: BreadcrumbTrailItem[] };

function toEntries(
  items: BreadcrumbTrailItem[],
  maxItems: number,
  before: number,
  after: number,
): TrailEntry[] {
  const entry = (item: BreadcrumbTrailItem, index: number): TrailEntry => ({
    kind: 'item',
    item,
    current: index === items.length - 1,
  });
  const hidden = items.length - before - after;
  if (items.length <= maxItems || hidden < 2) {
    return items.map(entry);
  }
  return [
    ...items.slice(0, before).map(entry),
    { kind: 'collapsed', items: items.slice(before, before + hidden) },
    ...items
      .slice(items.length - after)
      .map((item, offset) => entry(item, items.length - after + offset)),
  ];
}

/**
 * Data-driven breadcrumb: pass the trail and long ones collapse their middle
 * into an ellipsis menu. Build it from the primitives for custom layouts.
 */
function BreadcrumbTrail({
  items,
  maxItems = 4,
  itemsBeforeCollapse = 1,
  itemsAfterCollapse = 2,
  moreLabel,
  ...props
}: BreadcrumbTrailProps) {
  const entries = toEntries(items, maxItems, itemsBeforeCollapse, itemsAfterCollapse);
  return (
    <Breadcrumb {...props}>
      <BreadcrumbList>
        {entries.map((entry, index) => (
          <Fragment key={entry.kind === 'item' ? `${entry.item.label}-${index}` : 'collapsed'}>
            {index > 0 ? <BreadcrumbSeparator /> : null}
            <BreadcrumbItem>
              {entry.kind === 'collapsed' ? (
                <BreadcrumbEllipsis items={entry.items} label={moreLabel} />
              ) : entry.current ? (
                <BreadcrumbPage>{entry.item.label}</BreadcrumbPage>
              ) : entry.item.href === undefined ? (
                <span>{entry.item.label}</span>
              ) : (
                <BreadcrumbLink href={entry.item.href}>{entry.item.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbTrail,
};
export type { BreadcrumbEllipsisProps, BreadcrumbProps, BreadcrumbTrailItem, BreadcrumbTrailProps };

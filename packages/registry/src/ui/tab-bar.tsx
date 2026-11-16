import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import type { IconProps } from '@/components/ui/icons';
import { useLocale, type Direction } from '@/lib/locale';
import { nextTabIndex, panelDomId, tabDomId } from '@/lib/tab-bar';
import { cn } from '@/lib/utils';
import { variants } from '@/lib/variants';

const trackVariants = variants(
  'flex w-full items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
  {
    variants: {
      variant: {
        pill: 'gap-field rounded-pill border border-stroke bg-surface p-1',
        plain: 'gap-inline rounded-lg border border-stroke bg-surface px-field py-1',
        underline: 'gap-row border-b border-stroke',
      },
    },
    defaultVariants: { variant: 'pill' },
  },
);

const tabVariants = variants(
  [
    'group/tab relative inline-flex cursor-pointer items-center justify-center gap-field whitespace-nowrap text-button-2 text-text-secondary',
    'outline-none transition-colors duration-150 motion-reduce:transition-none',
    'enabled:hover:text-text-primary disabled:cursor-not-allowed disabled:text-text-inactive',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    '[&>svg]:size-4 [&>svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        pill: 'h-11 flex-[1_0_auto] rounded-pill px-5 aria-selected:bg-primary-light aria-selected:text-primary-text sm:h-10',
        plain: 'h-11 flex-none rounded-control px-field aria-selected:text-text-primary sm:h-9',
        // The indicator is the tab's own bottom border, so it follows the tab
        // in both directions and while the track scrolls.
        underline:
          '-mb-px h-11 flex-none border-b-2 border-transparent px-1 aria-selected:border-primary aria-selected:text-primary-text sm:h-10',
      },
      fill: { true: '', false: '' },
    },
    compoundVariants: [
      // Split the track evenly; plain and underline tabs never stretch.
      { variant: 'pill', fill: true, class: 'flex-1' },
    ],
    defaultVariants: { variant: 'pill', fill: false },
  },
);

/**
 * Lets a `TabBar` hear about panels that mount or unmount somewhere else in
 * the tree. Without a provider the bar checks the DOM whenever it renders,
 * which is enough while the bar and its panels re-render together.
 */
interface PanelRegistry {
  revision: number;
  changed: () => void;
}

const PanelRegistryContext = createContext<PanelRegistry | null>(null);

/**
 * Optional wrapper for pages where a `TabPanel` is rendered by a component
 * other than the one rendering the `TabBar` (so a panel can appear without the
 * bar re-rendering). Panels notify it; the bar re-checks which panels exist.
 */
function TabBarProvider({ children }: { children: ReactNode }) {
  const [revision, setRevision] = useState(0);
  const changed = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);
  const value = useMemo(() => ({ revision, changed }), [revision, changed]);
  return <PanelRegistryContext value={value}>{children}</PanelRegistryContext>;
}

type TabBarVariant = 'pill' | 'plain' | 'underline';

interface TabBarItem<TId extends string = string> {
  /** Stable id; becomes part of the DOM ids, so keep it free of spaces. */
  id: TId;
  label: string;
  /** Number shown in a badge after the label (unread, pending…). */
  count?: number;
  disabled?: boolean;
  icon?: ComponentType<IconProps>;
}

interface TabBarProps<TId extends string = string> {
  items: readonly TabBarItem<TId>[];
  /** Id of the active tab. The bar is controlled: the caller owns this state. */
  value: TId;
  onValueChange: (id: TId) => void;
  /** `pill` (default): filled active pill in a rounded track. `plain`: text-only in a bordered strip. `underline`: a bottom rule under the active tab. */
  variant?: TabBarVariant;
  /** Pill only: the tabs share the track's width evenly (narrow screens). */
  fill?: boolean;
  /** Accessible name of the tab list. */
  'aria-label'?: string;
  /** Scopes the DOM ids so several tab sets can share a page (use `useId()`); pass the same value to every `TabPanel` of the set. */
  idPrefix?: string;
  /** Text direction for the arrow keys; defaults to the active locale's. */
  dir?: Direction;
  className?: string;
}

/**
 * Items-based tabs, controlled by `value`. The bar renders only the tab list:
 * panels are separate `TabPanel`s that can live anywhere (siblings, other
 * components), linked by ids derived from the item id. Keyboard: Left/Right
 * (mirrored in RTL) move to and select the neighbouring tab, Home/End jump to
 * the ends, disabled tabs are skipped, and only the active tab is in the tab
 * order (roving tabindex). `aria-controls` is set only for tabs whose panel is
 * actually on the page, so a bar used as a filter stays valid.
 */
function TabBar<TId extends string = string>({
  items,
  value,
  onValueChange,
  variant = 'pill',
  fill = false,
  'aria-label': ariaLabel,
  idPrefix,
  dir,
  className,
}: TabBarProps<TId>) {
  const locale = useLocale();
  const direction = dir ?? locale.direction;
  // Subscribes the bar to panel changes announced through a TabBarProvider.
  useContext(PanelRegistryContext);
  const listRef = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const [linked, setLinked] = useState<ReadonlySet<string>>(new Set());

  const hasEnabledActive = items.some((item) => item.id === value && !item.disabled);
  const fallbackId = items.find((item) => !item.disabled)?.id;

  // Layout effect, so the first paint already has the right aria-controls.
  // Runs after every render (no deps, as ids and panels can change anywhere);
  // the state only changes when the set of linked panels does.
  useLayoutEffect(() => {
    const root = listRef.current?.ownerDocument ?? document;
    const present = items
      .filter((item) => root.getElementById(panelDomId(item.id, idPrefix)) !== null)
      .map((item) => item.id);
    setLinked((previous) =>
      previous.size === present.length && present.every((id) => previous.has(id))
        ? previous
        : new Set(present),
    );
  });

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const enabled = items.flatMap((item, position) => (item.disabled ? [] : [position]));
    const target = nextTabIndex(event.key, enabled, index, direction);
    const next = target === undefined ? undefined : items[target];
    if (!next) {
      return;
    }
    event.preventDefault();
    onValueChange(next.id);
    buttons.current.get(next.id)?.focus();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      data-slot="tab-bar"
      data-variant={variant}
      dir={dir}
      className={cn(trackVariants({ variant }), className)}
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        const active = item.id === value;
        const focusable = hasEnabledActive ? active : item.id === fallbackId;
        return (
          <button
            key={item.id}
            ref={(element) => {
              if (element) {
                buttons.current.set(item.id, element);
              } else {
                buttons.current.delete(item.id);
              }
            }}
            id={tabDomId(item.id, idPrefix)}
            type="button"
            role="tab"
            data-slot="tab-bar-tab"
            aria-selected={active}
            aria-controls={linked.has(item.id) ? panelDomId(item.id, idPrefix) : undefined}
            tabIndex={focusable ? 0 : -1}
            disabled={item.disabled}
            className={tabVariants({ variant, fill })}
            onClick={() => {
              onValueChange(item.id);
            }}
            onKeyDown={(event) => {
              handleKeyDown(event, index);
            }}
          >
            {Icon ? <Icon /> : null}
            {item.label}
            {item.count === undefined ? null : (
              <span
                data-slot="tab-bar-count"
                className="rounded-pill bg-surface-dim text-label text-text-secondary group-aria-selected/tab:bg-primary group-aria-selected/tab:text-primary-foreground inline-flex h-5.5 min-w-5.5 items-center justify-center px-1.5 tabular-nums"
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface TabPanelProps<TId extends string = string> extends Omit<
  React.ComponentProps<'div'>,
  'id' | 'role' | 'children'
> {
  /** Whether this panel's tab is the active one. An inactive panel renders nothing. */
  active: boolean;
  children: ReactNode;
  /** Id of the matching `TabBarItem`; links the panel to its tab. */
  value: TId;
  /** Must match the `idPrefix` of the bar. */
  idPrefix?: string;
}

/** Panel for one tab. Render it anywhere: it is linked to its tab by id, not by nesting. */
function TabPanel<TId extends string = string>({
  active,
  children,
  value,
  idPrefix,
  className,
  ...props
}: TabPanelProps<TId>) {
  const registry = useContext(PanelRegistryContext);
  const changed = registry?.changed;
  // Tell a TabBarProvider (if any) that a panel appeared or went away.
  useLayoutEffect(() => {
    if (!active || !changed) {
      return undefined;
    }
    changed();
    return changed;
  }, [active, changed, value, idPrefix]);

  if (!active) {
    return null;
  }
  return (
    <div
      {...props}
      role="tabpanel"
      id={panelDomId(value, idPrefix)}
      aria-labelledby={tabDomId(value, idPrefix)}
      data-slot="tab-panel"
      className={cn('rounded-md outline-none', className)}
    >
      {children}
    </div>
  );
}

export { TabBar, TabBarProvider, TabPanel };
export type { TabBarItem, TabBarProps, TabBarVariant, TabPanelProps };

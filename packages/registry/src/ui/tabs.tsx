import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { createContext, useContext } from 'react';
import { useLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';
import { variants, type VariantProps } from '@/lib/variants';

const tabsListVariants = variants(
  // The list scrolls sideways on narrow screens instead of wrapping or clipping.
  'flex max-w-full items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch data-[orientation=vertical]:overflow-x-visible',
  {
    variants: {
      variant: {
        underline: 'gap-row border-b border-stroke data-[orientation=vertical]:gap-0 data-[orientation=vertical]:border-b-0 data-[orientation=vertical]:border-e',
        pill: 'w-fit gap-1 rounded-lg bg-hover-row p-1',
      },
    },
    defaultVariants: { variant: 'underline' },
  },
);

const tabsTriggerVariants = variants(
  [
    'relative inline-flex min-h-11 shrink-0 items-center justify-center gap-field whitespace-nowrap text-button-1 text-text-secondary select-none sm:min-h-9',
    'outline-none transition-colors motion-reduce:transition-none',
    'hover:text-text-primary data-[active]:text-text-primary',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        // The indicator is a bottom border on the active tab itself, so it
        // follows the tab in both directions and while the list scrolls.
        underline:
          '-mb-px border-b-2 border-transparent px-1 data-[active]:border-primary data-[active]:text-primary-text data-[orientation=vertical]:mb-0 data-[orientation=vertical]:-me-px data-[orientation=vertical]:justify-start data-[orientation=vertical]:border-b-0 data-[orientation=vertical]:border-e-2 data-[orientation=vertical]:px-inline',
        pill: 'rounded-md px-inline data-[active]:bg-surface data-[active]:shadow-small',
      },
    },
    defaultVariants: { variant: 'underline' },
  },
);

type TabsVariant = NonNullable<VariantProps<typeof tabsListVariants>['variant']>;

const TabsVariantContext = createContext<TabsVariant>('underline');

interface TabsProps extends TabsPrimitive.Root.Props {
  variant?: TabsVariant;
}

/**
 * Tabs with roving focus: Left/Right (mirrored in RTL) move between tabs,
 * Home/End jump to the ends. The list scrolls horizontally when it overflows.
 */
function Tabs({ className, variant = 'underline', ...props }: TabsProps) {
  // Base UI reads direction from its own context, not <html dir>; without
  // this the arrow keys would not mirror in Arabic.
  const { direction } = useLocale();
  return (
    <DirectionProvider direction={direction}>
      <TabsVariantContext value={variant}>
        <TabsPrimitive.Root
          data-slot="tabs"
          className={cn('flex flex-col gap-row data-[orientation=vertical]:flex-row', className)}
          {...props}
        />
      </TabsVariantContext>
    </DirectionProvider>
  );
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  const variant = useContext(TabsVariantContext);
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  const variant = useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(
        'flex-1 rounded-md outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants, tabsTriggerVariants };
export type { TabsProps, TabsVariant };

import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';
import { createContext, useContext } from 'react';
import { ChevronDownIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { variants, type VariantProps } from '@/lib/variants';

const accordionVariants = variants('flex w-full flex-col', {
  variants: {
    variant: {
      default: '',
      // Compact, borderless groups for navigation sidebars.
      sidebar: 'gap-1',
    },
  },
  defaultVariants: { variant: 'default' },
});

const accordionItemVariants = variants('', {
  variants: {
    variant: {
      default: 'border-b border-stroke last:border-b-0',
      sidebar: '',
    },
  },
  defaultVariants: { variant: 'default' },
});

const accordionTriggerVariants = variants(
  [
    'group/accordion-trigger flex w-full flex-1 items-center justify-between gap-field text-start outline-none',
    'transition-colors motion-reduce:transition-none',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: 'min-h-11 rounded-md px-1 py-row text-h5 text-text-primary hover:text-primary-text',
        sidebar:
          'min-h-11 rounded-md px-inline text-b1 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground sm:min-h-9',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

type AccordionVariant = NonNullable<VariantProps<typeof accordionVariants>['variant']>;

const AccordionVariantContext = createContext<AccordionVariant>('default');

interface AccordionProps extends AccordionPrimitive.Root.Props {
  variant?: AccordionVariant;
}

/**
 * Collapsible sections. One panel open at a time by default; pass `multiple`
 * to let several stay open. Open state is `defaultValue`/`value`: an array of
 * the open item values.
 */
function Accordion({ className, variant = 'default', ...props }: AccordionProps) {
  return (
    <AccordionVariantContext value={variant}>
      <AccordionPrimitive.Root
        data-slot="accordion"
        className={cn(accordionVariants({ variant }), className)}
        {...props}
      />
    </AccordionVariantContext>
  );
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  const variant = useContext(AccordionVariantContext);
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(accordionItemVariants({ variant }), className)}
      {...props}
    />
  );
}

function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props) {
  const variant = useContext(AccordionVariantContext);
  return (
    <AccordionPrimitive.Header data-slot="accordion-header" className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(accordionTriggerVariants({ variant }), className)}
        {...props}
      >
        {children}
        <ChevronDownIcon
          className={cn(
            'size-4 text-text-muted transition-transform duration-200 motion-reduce:transition-none',
            'group-data-[panel-open]/accordion-trigger:rotate-180',
          )}
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: AccordionPrimitive.Panel.Props) {
  const variant = useContext(AccordionVariantContext);
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      // Height runs on Base UI's measured --accordion-panel-height; padding
      // lives on the inner div so it does not break the animation.
      className={cn(
        'h-(--accordion-panel-height) overflow-hidden text-b1 text-text-secondary',
        'transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0',
        'motion-reduce:transition-none',
        className,
      )}
      {...props}
    >
      <div className={variant === 'sidebar' ? 'ps-row pt-1' : 'px-1 pb-row'}>{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  accordionTriggerVariants,
};
export type { AccordionProps, AccordionVariant };

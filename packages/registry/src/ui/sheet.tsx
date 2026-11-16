import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';
import { Button } from '@/components/ui/button';
import { CloseIcon } from '@/components/ui/icons';
import { useLabels, useLocale, type Direction, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';
import { variants, type VariantProps } from '@/lib/variants';

const messages: Messages<'close'> = {
  en: { close: 'Close' },
  ar: { close: 'إغلاق' },
};

const sheetVariants = variants(
  [
    'fixed z-50 flex flex-col bg-popover text-popover-foreground shadow-xlarge outline-none',
    'transition-[translate] duration-300 ease-out motion-reduce:transition-none',
  ],
  {
    variants: {
      // `start`/`end` are logical: `end` is the left edge in RTL, so the
      // panel and its slide direction flip with the page.
      side: {
        start:
          'inset-y-0 start-0 h-full w-3/4 max-w-sm border-e border-stroke data-[ending-style]:ltr:-translate-x-full data-[ending-style]:rtl:translate-x-full data-[starting-style]:ltr:-translate-x-full data-[starting-style]:rtl:translate-x-full',
        end: 'inset-y-0 end-0 h-full w-3/4 max-w-sm border-s border-stroke data-[ending-style]:ltr:translate-x-full data-[ending-style]:rtl:-translate-x-full data-[starting-style]:ltr:translate-x-full data-[starting-style]:rtl:-translate-x-full',
        top: 'inset-x-0 top-0 max-h-[85dvh] border-b border-stroke data-[ending-style]:-translate-y-full data-[starting-style]:-translate-y-full',
        bottom:
          'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-modal border-t border-stroke data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full',
      },
    },
    defaultVariants: { side: 'end' },
  },
);

type SheetSide = NonNullable<VariantProps<typeof sheetVariants>['side']>;

/**
 * What `SheetContent` accepts for `side`: the logical sides, the
 * `inline-start` / `inline-end` spellings of start/end, and the physical
 * `left` / `right`, which are resolved against the current direction (`right`
 * is the end edge in English and the start edge in Arabic).
 */
type SheetSideInput = SheetSide | 'inline-start' | 'inline-end' | 'left' | 'right';

/** Maps any accepted side to one of the four logical sides for a direction. */
function resolveSheetSide(side: SheetSideInput, direction: Direction): SheetSide {
  switch (side) {
    case 'inline-start':
      return 'start';
    case 'inline-end':
      return 'end';
    case 'left':
      return direction === 'rtl' ? 'end' : 'start';
    case 'right':
      return direction === 'rtl' ? 'start' : 'end';
    default:
      return side;
  }
}

function Sheet(props: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(props: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(props: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

interface SheetContentProps extends SheetPrimitive.Popup.Props {
  /**
   * Edge the panel slides from. `start`/`end` are logical (`end` is the left
   * edge in RTL); `left`/`right` are physical aliases resolved against the
   * current direction. Default `end`.
   */
  side?: SheetSideInput;
  /** Show the corner close button. Default true. */
  showCloseButton?: boolean;
  /** Accessible name of the close button; defaults to the localised "Close". */
  closeLabel?: string;
}

/** Modal side panel: focus is trapped, the page behind is inert, Escape closes. */
function SheetContent({
  className,
  children,
  side = 'end',
  showCloseButton = true,
  closeLabel,
  ...props
}: SheetContentProps) {
  const labels = useLabels(messages, closeLabel ? { close: closeLabel } : undefined);
  const { direction } = useLocale();
  const edge = resolveSheetSide(side, direction);
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Backdrop
        data-slot="sheet-backdrop"
        className={cn(
          'fixed inset-0 z-50 bg-scrim',
          'transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0',
          'motion-reduce:transition-none',
        )}
      />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={edge}
        className={cn(sheetVariants({ side: edge }), className)}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="end-inline top-inline absolute"
                aria-label={labels.close}
              />
            }
          >
            <CloseIcon />
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Popup>
    </SheetPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-1 p-card pb-row pe-14', className)}
      {...props}
    />
  );
}

function SheetBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-body"
      className={cn('min-h-0 flex-1 overflow-y-auto px-card py-2', className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        'mt-auto flex flex-col-reverse gap-field p-card pt-row sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-h3 text-text-primary', className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-b2 text-text-secondary', className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  resolveSheetSide,
  sheetVariants,
};
export type { SheetContentProps, SheetSide, SheetSideInput };

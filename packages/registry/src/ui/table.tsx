import type { ComponentProps, CSSProperties, Ref } from 'react';
import { cn } from '@/lib/utils';
import { variants, type VariantProps } from '@/lib/variants';

type StickySide = 'start' | 'end';

const cellVariants = variants('', {
  variants: {
    align: {
      start: 'text-start',
      center: 'text-center',
      end: 'text-end',
    },
    numeric: {
      true: 'text-end tabular-nums',
      false: '',
    },
    sticky: {
      start: 'sticky start-0 z-[1] bg-inherit',
      end: 'sticky end-0 z-[1] bg-inherit',
    },
  },
});

type CellVariantProps = VariantProps<typeof cellVariants>;

interface TableProps extends ComponentProps<'table'> {
  /**
   * Keeps the header row visible while the body scrolls. The scroll happens
   * inside the container, so give it a height via `containerClassName`
   * (for example `max-h-96`).
   */
  stickyHeader?: boolean;
  /** Classes for the horizontal scroll container around the `<table>`. */
  containerClassName?: string;
  /** Inline style for the scroll container, for a height that is only known at run time. */
  containerStyle?: CSSProperties;
  /** Ref to the scroll container, for scroll-driven features such as virtualisation. */
  containerRef?: Ref<HTMLDivElement>;
  /** Make the scroll container a tab stop so the keyboard can scroll it. Turn off when the cells are focusable themselves. Default true. */
  containerFocusable?: boolean;
  /**
   * Names the scroll container as a region (`role="region"`). Screen readers
   * then announce what the focusable box is; without it a focusable `div` has
   * no name. Only applied while the container is focusable.
   */
  containerLabel?: string;
}

/**
 * Semantic `<table>` inside its own scroll container, so a wide table scrolls
 * sideways without the page doing so. The container is focusable so keyboard
 * users can scroll it.
 */
function Table({
  className,
  containerClassName,
  containerStyle,
  containerRef,
  containerFocusable = true,
  containerLabel,
  stickyHeader = false,
  ...props
}: TableProps) {
  return (
    <div
      ref={containerRef}
      style={containerStyle}
      data-slot="table-container"
      tabIndex={containerFocusable ? 0 : undefined}
      role={containerFocusable && containerLabel ? 'region' : undefined}
      aria-label={containerFocusable ? containerLabel : undefined}
      className={cn(
        'relative w-full overflow-auto rounded-lg border border-stroke bg-surface',
        'outline-none focus-visible:ring-2 focus-visible:ring-ring',
        containerClassName,
      )}
    >
      <table
        data-slot="table"
        data-sticky-header={stickyHeader ? '' : undefined}
        className={cn(
          'group/table w-full caption-bottom border-collapse text-b1 text-text-primary',
          className,
        )}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('[&_tr]:border-b [&_tr]:border-stroke', className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-b-0', className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn('border-t border-stroke bg-surface-dim text-h5', className)}
      {...props}
    />
  );
}

interface TableRowProps extends ComponentProps<'tr'> {
  /** Highlights the row as selected (the selection control carries the semantics). */
  selected?: boolean;
}

function TableRow({ className, selected = false, ...props }: TableRowProps) {
  return (
    <tr
      data-slot="table-row"
      data-state={selected ? 'selected' : undefined}
      className={cn(
        'group/row border-b border-stroke bg-surface transition-colors motion-reduce:transition-none',
        'hover:bg-hover-row data-[state=selected]:bg-primary-tint',
        className,
      )}
      {...props}
    />
  );
}

interface TableHeadProps
  extends Omit<ComponentProps<'th'>, 'align'>, Omit<CellVariantProps, 'sticky'> {
  /** Pins the column to the start or end edge while the table scrolls sideways. */
  sticky?: StickySide;
}

function TableHead({
  className,
  align = 'start',
  numeric,
  sticky,
  scope = 'col',
  ...props
}: TableHeadProps) {
  return (
    <th
      data-slot="table-head"
      scope={scope}
      className={cn(
        'h-11 whitespace-nowrap bg-surface-dim px-inline align-middle text-table-header text-text-secondary',
        'group-data-[sticky-header]/table:sticky group-data-[sticky-header]/table:top-0 group-data-[sticky-header]/table:z-10',
        cellVariants({ align, numeric, sticky }),
        sticky && 'z-20 bg-surface-dim group-data-[sticky-header]/table:z-20',
        className,
      )}
      {...props}
    />
  );
}

interface TableCellProps
  extends Omit<ComponentProps<'td'>, 'align'>, Omit<CellVariantProps, 'sticky'> {
  sticky?: StickySide;
}

function TableCell({ className, align = 'start', numeric, sticky, ...props }: TableCellProps) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'px-inline py-field align-middle',
        cellVariants({ align, numeric, sticky }),
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('mt-field text-b2 text-text-muted', className)}
      {...props}
    />
  );
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
export type { StickySide, TableCellProps, TableHeadProps, TableProps, TableRowProps };

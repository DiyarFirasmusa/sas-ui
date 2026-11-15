import type { ReactNode } from 'react';
import { InboxIcon, SearchIcon } from '@/components/ui/icons';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';
import { variants, type VariantProps } from '@/lib/variants';

const messages: Messages<'emptyTitle' | 'noResultsTitle' | 'noResultsDescription'> = {
  en: {
    emptyTitle: 'Nothing here yet',
    noResultsTitle: 'No results found',
    noResultsDescription: 'Try a different search or clear the filters.',
  },
  ar: {
    emptyTitle: 'لا توجد بيانات بعد',
    noResultsTitle: 'لا توجد نتائج',
    noResultsDescription: 'جرّب بحثًا مختلفًا أو أزل عوامل التصفية.',
  },
};

const emptyStateVariants = variants('flex flex-col items-center justify-center text-center', {
  variants: {
    size: {
      compact: 'gap-field px-row py-panel',
      page: 'min-h-80 gap-inline px-row py-page',
    },
  },
  defaultVariants: { size: 'compact' },
});

const iconTileVariants = variants('inline-flex items-center justify-center rounded-pill [&>svg]:size-1/2', {
  variants: {
    size: { compact: 'size-12', page: 'size-16' },
    tone: {
      neutral: 'bg-surface-dim text-text-muted',
      warning: 'bg-tag-yellow-container text-tag-yellow',
      danger: 'bg-tag-red-container text-tag-red',
    },
  },
  defaultVariants: { size: 'compact', tone: 'neutral' },
});

type EmptyStateTitleElement = 'h1' | 'h2' | 'h3' | 'h4' | 'p';

interface EmptyStateProps
  extends Omit<React.ComponentProps<'div'>, 'title'>,
    VariantProps<typeof emptyStateVariants> {
  /** `no-results` is the "search or filters matched nothing" wording and icon. */
  preset?: 'empty' | 'no-results';
  /** Replaces the preset icon; pass `null` for none. */
  icon?: ReactNode;
  tone?: VariantProps<typeof iconTileVariants>['tone'];
  /** Defaults to the preset's localized title. */
  title?: ReactNode;
  description?: ReactNode;
  /** Buttons or links under the text. */
  actions?: ReactNode;
  /** Heading level for the title. Default `h2`. */
  titleAs?: EmptyStateTitleElement;
}

/** Centred icon, title, description and actions for a list, table or page with nothing to show. */
function EmptyState({
  className,
  size,
  preset = 'empty',
  icon,
  tone,
  title,
  description,
  actions,
  titleAs: TitleElement = 'h2',
  children,
  ...props
}: EmptyStateProps) {
  const labels = useLabels(messages);
  const noResults = preset === 'no-results';
  const glyph = icon === undefined ? noResults ? <SearchIcon /> : <InboxIcon /> : icon;
  const heading = title ?? (noResults ? labels.noResultsTitle : labels.emptyTitle);
  const body = description ?? (noResults ? labels.noResultsDescription : undefined);
  return (
    <div
      data-slot="empty-state"
      className={cn(emptyStateVariants({ size }), className)}
      {...props}
    >
      {glyph === null ? null : (
        <span aria-hidden="true" data-slot="empty-state-icon" className={iconTileVariants({ size, tone })}>
          {glyph}
        </span>
      )}
      <TitleElement className={cn('text-text-primary', size === 'page' ? 'text-h3' : 'text-h5')}>
        {heading}
      </TitleElement>
      {body ? <p className="max-w-md text-b2 text-text-secondary">{body}</p> : null}
      {children}
      {actions ? <div className="mt-field flex flex-wrap items-center justify-center gap-field">{actions}</div> : null}
    </div>
  );
}

export { emptyStateVariants, EmptyState, iconTileVariants };
export type { EmptyStateProps };

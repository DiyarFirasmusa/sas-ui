import { cn } from '@/lib/utils';

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'flex flex-col gap-row rounded-xl border border-stroke bg-surface py-card text-text-primary shadow-small',
        className,
      )}
      {...props}
    />
  );
}

/** Title row. A `CardAction` inside it sits at the end edge, beside title and description. */
function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-row gap-y-1 px-card', className)}
      {...props}
    />
  );
}

type CardTitleElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';

interface CardTitleProps extends React.ComponentProps<'div'> {
  /** Element to render. Pick the heading level that fits the page outline. Default `h3`. */
  as?: CardTitleElement;
}

function CardTitle({ className, as: Element = 'h3', ...props }: CardTitleProps) {
  return (
    <Element
      data-slot="card-title"
      className={cn('col-start-1 text-h4 text-text-primary', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="card-description"
      className={cn('col-start-1 text-b2 text-text-secondary', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-card', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center gap-field px-card', className)}
      {...props}
    />
  );
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
export type { CardTitleProps };

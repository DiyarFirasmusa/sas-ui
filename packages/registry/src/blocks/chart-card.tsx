import type { ReactNode } from 'react';
import { TrendingDownIcon, TrendingUpIcon } from '@/components/blocks/block-icons';
import type { ChartTrend } from '@/components/blocks/chart-data';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardTitleProps,
} from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';

interface ChartCardProps extends Omit<React.ComponentProps<typeof Card>, 'title'> {
  title: ReactNode;
  /** Heading level of the title; pick the one that fits the page outline. Default `h3`. */
  titleAs?: CardTitleProps['as'];
  description?: ReactNode;
  /** Control at the end of the header, such as a range select. */
  action?: ReactNode;
  /** Footer line: the direction of change in words, with an icon. */
  trend?: ChartTrend;
  /** Quiet second footer line, e.g. the period the data covers. */
  footnote?: ReactNode;
  /** Shows a failure instead of the chart. A string becomes the technical detail. */
  error?: boolean | string;
  /** Adds a retry button to the error state. */
  onRetry?: () => void;
  children: ReactNode;
}

const TONE_CLASS = {
  positive: 'text-success',
  negative: 'text-danger',
  neutral: 'text-text-secondary',
} as const;

function toneOf(trend: ChartTrend): keyof typeof TONE_CLASS {
  if (trend.tone) {
    return trend.tone;
  }
  return trend.direction === 'up'
    ? 'positive'
    : trend.direction === 'down'
      ? 'negative'
      : 'neutral';
}

/**
 * The frame every chart block shares: a card with a title, description and
 * optional header action, the chart (or an error state), and a footer with a
 * trend sentence and a footnote.
 */
function ChartCard({
  title,
  titleAs,
  description,
  action,
  trend,
  footnote,
  error = false,
  onRetry,
  className,
  children,
  ...props
}: ChartCardProps) {
  const Trend = trend?.direction === 'down' ? TrendingDownIcon : TrendingUpIcon;
  return (
    <Card data-slot="chart-card" className={cn('min-w-0', className)} {...props}>
      <CardHeader>
        <CardTitle as={titleAs}>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? (
          // On phones the control drops under the title instead of squeezing it.
          <CardAction className="max-sm:mt-field max-sm:col-start-1 max-sm:row-span-1 max-sm:row-start-3 max-sm:justify-self-start">
            {action}
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState
            titleAs="p"
            details={typeof error === 'string' ? error : undefined}
            onRetry={onRetry}
          />
        ) : (
          children
        )}
      </CardContent>
      {trend || footnote ? (
        <CardFooter className="flex-col items-start">
          {trend ? (
            <p
              data-slot="chart-trend"
              data-direction={trend.direction}
              className={cn('text-label flex items-center gap-1', TONE_CLASS[toneOf(trend)])}
            >
              {trend.direction === 'flat' ? null : <Trend className="size-4" />}
              {trend.text}
            </p>
          ) : null}
          {footnote ? <p className="text-b3 text-text-muted">{footnote}</p> : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}

export { ChartCard };
export type { ChartCardProps };

import type { ReactNode } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ErrorState, type ErrorStateKind } from '@/components/ui/error-state';
import type { IconProps } from '@/components/ui/icons';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<
  | 'home'
  | 'back'
  | 'retry'
  | 'support'
  | 'reference'
  | 'offlineTitle'
  | 'offlineDescription'
  | 'maintenanceTitle'
  | 'maintenanceDescription'
> = {
  en: {
    home: 'Back to home',
    back: 'Go back',
    retry: 'Try again',
    support: 'Contact support',
    reference: 'Reference',
    offlineTitle: 'You are offline',
    offlineDescription: 'Check your internet connection. We will pick up where you left off.',
    maintenanceTitle: 'Down for maintenance',
    maintenanceDescription: 'We are making improvements and will be back shortly.',
  },
  ar: {
    home: 'العودة إلى الرئيسية',
    back: 'رجوع',
    retry: 'إعادة المحاولة',
    support: 'تواصل مع الدعم',
    reference: 'المرجع',
    offlineTitle: 'لا يوجد اتصال بالإنترنت',
    offlineDescription: 'تحقق من اتصالك بالإنترنت. سنكمل من حيث توقفت.',
    maintenanceTitle: 'الخدمة متوقفة للصيانة',
    maintenanceDescription: 'نجري بعض التحسينات وسنعود قريباً.',
  },
};

type ErrorPage01Kind = '403' | '404' | '500' | 'offline' | 'maintenance';

/** The wording and look each kind borrows from `ErrorState`; offline and maintenance only borrow the tone. */
const KINDS: Record<ErrorPage01Kind, { state: ErrorStateKind; code?: string; retryable: boolean }> =
  {
    '403': { state: 'forbidden', code: '403', retryable: false },
    '404': { state: 'not-found', code: '404', retryable: false },
    '500': { state: 'error', code: '500', retryable: true },
    offline: { state: 'forbidden', retryable: true },
    maintenance: { state: 'not-found', code: '503', retryable: true },
  };

function WifiOffIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="size-4 shrink-0"
      {...props}
    >
      <path d="m2 2 20 20M8.5 16.5a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 4.2-2.6M10.7 5.1A15 15 0 0 1 22 8.8M5 12.9a10 10 0 0 1 3.9-2.4M13.8 10.4a10 10 0 0 1 5.2 2.5M12 20h.01" />
    </svg>
  );
}

interface ErrorPage01Props extends Omit<React.ComponentProps<'main'>, 'title'> {
  /** Which failure to show. Default `404`. */
  kind?: ErrorPage01Kind;
  /** Replaces the localized heading and text of the kind. */
  title?: ReactNode;
  description?: ReactNode;
  /** Where "Back to home" goes. Default `/`. */
  homeHref?: string;
  /** Called by "Go back" (403, 404); without it the browser history goes back. */
  onBack?: () => void;
  /** "Try again" (500, offline, maintenance). Without it the button is not shown. */
  onRetry?: () => void;
  /** Blocks the retry button and shows its spinner while a retry is running. */
  retrying?: boolean;
  /** Where "Contact support" goes (maintenance, 500). Omit to hide the link. */
  supportHref?: string;
  /** Request or trace ID to quote to support; always left-to-right. */
  reference?: string;
  labels?: Partial<Record<keyof (typeof messages)['en'], string>>;
}

/**
 * Full-page failure screen: 403, 404, 500, offline or maintenance. The code is
 * Latin digits in every language; the heading and text come from `ErrorState`
 * (or the offline/maintenance wording here). Home is the primary action, with
 * go-back or retry beside it. The page is announced as an alert on arrival.
 */
function ErrorPage01({
  kind = '404',
  title,
  description,
  homeHref = '/',
  onBack,
  onRetry,
  retrying = false,
  supportHref,
  reference,
  labels: overrides,
  className,
  ...props
}: ErrorPage01Props) {
  const labels = useLabels(messages, overrides);
  const config = KINDS[kind];
  const custom =
    kind === 'offline'
      ? {
          title: labels.offlineTitle,
          description: labels.offlineDescription,
          icon: <WifiOffIcon />,
        }
      : kind === 'maintenance'
        ? { title: labels.maintenanceTitle, description: labels.maintenanceDescription }
        : {};

  return (
    <main
      data-kind={kind}
      className={cn('grid min-h-svh place-items-center bg-background p-row', className)}
      {...props}
    >
      <div className="flex w-full max-w-xl flex-col items-center">
        {config.code ? (
          <p
            dir="ltr"
            data-slot="error-code"
            className="font-heading text-primary-text text-[length:clamp(4.5rem,18vw,8rem)] leading-none font-bold tabular-nums"
          >
            {config.code}
          </p>
        ) : null}
        <ErrorState
          kind={config.state}
          size="page"
          titleAs="h1"
          title={title ?? custom.title}
          description={description ?? custom.description}
          icon={config.code ? null : 'icon' in custom ? custom.icon : undefined}
          details={
            reference ? (
              <>
                {labels.reference}: <span dir="ltr">{reference}</span>
              </>
            ) : undefined
          }
          actions={
            <>
              <a href={homeHref} className={buttonVariants()}>
                {labels.home}
              </a>
              {config.retryable ? (
                onRetry ? (
                  <Button type="button" variant="outline" loading={retrying} onClick={onRetry}>
                    {labels.retry}
                  </Button>
                ) : null
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack ?? (() => window.history.back())}
                >
                  {labels.back}
                </Button>
              )}
              {supportHref ? (
                <a href={supportHref} className={buttonVariants({ variant: 'ghost' })}>
                  {labels.support}
                </a>
              ) : null}
            </>
          }
        />
      </div>
    </main>
  );
}

export { ErrorPage01 };
export type { ErrorPage01Kind, ErrorPage01Props };

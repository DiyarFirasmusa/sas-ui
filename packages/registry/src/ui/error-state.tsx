import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, type EmptyStateProps } from '@/components/ui/empty-state';
import { AlertTriangleIcon, EyeOffIcon, SearchIcon } from '@/components/ui/icons';
import { useLabels, type Messages } from '@/lib/locale';

type ErrorStateKind = 'error' | 'not-found' | 'forbidden';

const messages: Messages<
  | 'retry'
  | 'errorTitle'
  | 'errorDescription'
  | 'notFoundTitle'
  | 'notFoundDescription'
  | 'forbiddenTitle'
  | 'forbiddenDescription'
> = {
  en: {
    retry: 'Try again',
    errorTitle: 'Something went wrong',
    errorDescription: 'We could not load this. Try again, and contact support if it keeps happening.',
    notFoundTitle: 'Page not found',
    notFoundDescription: 'The page you are looking for does not exist or has been moved.',
    forbiddenTitle: 'Access denied',
    forbiddenDescription: 'You do not have permission to view this. Ask an administrator for access.',
  },
  ar: {
    retry: 'إعادة المحاولة',
    errorTitle: 'حدث خطأ ما',
    errorDescription: 'تعذّر تحميل هذه البيانات. أعد المحاولة، وتواصل مع الدعم إذا استمرت المشكلة.',
    notFoundTitle: 'الصفحة غير موجودة',
    notFoundDescription: 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.',
    forbiddenTitle: 'لا تملك صلاحية الوصول',
    forbiddenDescription: 'ليست لديك صلاحية لعرض هذا المحتوى. اطلب الصلاحية من المسؤول.',
  },
};

interface ErrorStateProps extends Omit<EmptyStateProps, 'preset' | 'tone' | 'role'> {
  /** What went wrong. `not-found` and `forbidden` bring their own icon and wording. */
  kind?: ErrorStateKind;
  /** Shows a retry button that calls this. */
  onRetry?: () => void;
  /** Blocks the retry button and shows its spinner while a retry is running. */
  retrying?: boolean;
  retryLabel?: string;
  /** Technical detail such as the server message; shown beneath the description. */
  details?: ReactNode;
}

/** An `EmptyState` for failures. Announced immediately to assistive tech (`role="alert"`). */
function ErrorState({
  kind = 'error',
  title,
  description,
  icon,
  actions,
  onRetry,
  retrying = false,
  retryLabel,
  details,
  children,
  ...props
}: ErrorStateProps) {
  const labels = useLabels(messages, retryLabel ? { retry: retryLabel } : undefined);
  const preset = {
    error: {
      icon: <AlertTriangleIcon />,
      title: labels.errorTitle,
      description: labels.errorDescription,
      tone: 'danger',
    },
    'not-found': {
      icon: <SearchIcon />,
      title: labels.notFoundTitle,
      description: labels.notFoundDescription,
      tone: 'neutral',
    },
    forbidden: {
      icon: <EyeOffIcon />,
      title: labels.forbiddenTitle,
      description: labels.forbiddenDescription,
      tone: 'warning',
    },
  } as const;
  const chosen = preset[kind];
  return (
    <EmptyState
      role="alert"
      data-kind={kind}
      icon={icon === undefined ? chosen.icon : icon}
      tone={chosen.tone}
      title={title ?? chosen.title}
      description={description ?? chosen.description}
      actions={
        onRetry || actions ? (
          <>
            {onRetry ? (
              <Button type="button" variant="outline" loading={retrying} onClick={onRetry}>
                {labels.retry}
              </Button>
            ) : null}
            {actions}
          </>
        ) : undefined
      }
      {...props}
    >
      {details ? <p className="max-w-md text-b3 text-text-muted">{details}</p> : null}
      {children}
    </EmptyState>
  );
}

export { ErrorState };
export type { ErrorStateKind, ErrorStateProps };

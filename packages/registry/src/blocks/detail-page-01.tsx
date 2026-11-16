import { useMemo } from 'react';
import {
  APPLICATION_STAGES,
  clampStage,
  sampleApplication,
  type Application,
  type ApplicationDocument,
  type ApplicationStatus,
} from '@/components/blocks/detail-page-01-data';
import {
  messages,
  stageLabel,
  statusLabel,
  type DetailPage01Labels,
} from '@/components/blocks/detail-page-01-messages';
import {
  ActivityPanel,
  DocumentsPanel,
  OverviewPanel,
} from '@/components/blocks/detail-page-01-panels';
import { BreadcrumbTrail } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataBadge, type DataBadgeStatus } from '@/components/ui/data-badge';
import { PencilIcon, TrashIcon } from '@/components/ui/icons';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { StateWrapper, type AsyncState } from '@/components/ui/state-wrapper';
import { Stepper } from '@/components/ui/stepper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fillTemplate, formatCount } from '@/lib/format-message';
import { useLabels, useLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';

const STATUS_TONES: Record<ApplicationStatus, DataBadgeStatus['tone']> = {
  draft: 'neutral',
  'in-review': 'yellow',
  approved: 'green',
  rejected: 'red',
};
const STATUSES: readonly ApplicationStatus[] = ['draft', 'in-review', 'approved', 'rejected'];

type DetailPage01Tab = 'overview' | 'documents' | 'activity';

interface DetailPage01Props extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** The record, as an async result. Defaults to a sample application. */
  state?: AsyncState<Application>;
  onRetry?: () => void;
  /** Breadcrumb targets. */
  homeHref?: string;
  listHref?: string;
  /** Each action shows only when its handler is given. */
  onEdit?: (application: Application) => void;
  /** Runs after the user confirms; a rejection keeps the dialog open with the error. */
  onDelete?: (application: Application) => void | Promise<void>;
  onDownloadDocument?: (document: ApplicationDocument) => void;
  onRemoveDocument?: (document: ApplicationDocument) => void;
  /** Receives the queued files when the user presses Upload; a rejection shows an error and keeps the queue. */
  onUpload?: (files: File[]) => void | Promise<void>;
  defaultTab?: DetailPage01Tab;
  labels?: Partial<DetailPage01Labels>;
}

function DetailSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="gap-row flex flex-col">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-8 w-72 max-w-full" />
      <Skeleton className="h-16 w-full" />
      <div className="gap-row grid lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

/**
 * Record detail page: breadcrumb, status and actions in the header, the
 * workflow position as a stepper (a compact bar on phones), and tabs for the
 * overview, documents and activity. Loading and error come from `state`.
 */
function DetailPage01({
  state = { status: 'success', data: sampleApplication },
  onRetry,
  homeHref = '#',
  listHref = '#',
  onEdit,
  onDelete,
  onDownloadDocument,
  onRemoveDocument,
  onUpload,
  defaultTab = 'overview',
  labels: overrides,
  className,
  ...props
}: DetailPage01Props) {
  const labels = useLabels(messages, overrides);
  const { locale } = useLocale();
  const statusMap = useMemo<Record<string, DataBadgeStatus>>(
    () =>
      Object.fromEntries(
        STATUSES.map((status) => [
          status,
          { tone: STATUS_TONES[status], label: statusLabel(labels, status) },
        ]),
      ),
    [labels],
  );
  const steps = APPLICATION_STAGES.map((stage) => ({ label: stageLabel(labels, stage) }));

  function pipeline(application: Application) {
    // Approved means every stage, including the last, is done.
    const current =
      application.status === 'approved' ? steps.length : clampStage(application.stage);
    const rejected = application.status === 'rejected';
    const named = Math.min(current, steps.length - 1);
    const done = application.status === 'approved' ? steps.length : named + 1;
    return (
      <>
        <Stepper
          className="max-sm:hidden"
          label={labels.pipeline}
          current={current}
          steps={steps.map((step, index) => ({ ...step, error: rejected && index === current }))}
        />
        <div className="sm:hidden">
          <Progress
            size="sm"
            tone={rejected ? 'danger' : 'primary'}
            showValue={false}
            label={fillTemplate(labels.summaryStage, {
              n: formatCount(named + 1),
              total: formatCount(steps.length),
              stage: steps[named]?.label ?? '',
            })}
            value={Math.round((done / steps.length) * 100)}
          />
        </div>
      </>
    );
  }

  return (
    <div className={cn('bg-background p-4 md:p-page min-h-svh', className)} {...props}>
      <div className="gap-card flex w-full flex-col">
        <StateWrapper
          state={state}
          loading={<DetailSkeleton label={labels.loading} />}
          error={{ onRetry }}
        >
          {(application) => (
            <>
              <PageHeader
                breadcrumb={
                  <BreadcrumbTrail
                    items={[
                      { label: labels.breadcrumbHome, href: homeHref },
                      { label: labels.breadcrumbList, href: listHref },
                      { label: application.reference },
                    ]}
                  />
                }
                title={<span dir="auto">{application.applicant[locale]}</span>}
                badge={<DataBadge value={application.status} statusMap={statusMap} />}
                actions={
                  <>
                    {onEdit ? (
                      <Button variant="outline" onClick={() => onEdit(application)}>
                        <PencilIcon />
                        {labels.edit}
                      </Button>
                    ) : null}
                    {onDelete ? (
                      <ConfirmDialog
                        destructive
                        trigger={
                          <Button variant="destructive-soft">
                            <TrashIcon />
                            {labels.delete}
                          </Button>
                        }
                        title={labels.deleteTitle}
                        description={labels.deleteDescription}
                        confirmLabel={labels.deleteConfirm}
                        onConfirm={() => onDelete(application)}
                      />
                    ) : null}
                  </>
                }
              />
              {pipeline(application)}
              <Tabs defaultValue={defaultTab}>
                <TabsList>
                  <TabsTrigger value="overview">{labels.tabOverview}</TabsTrigger>
                  <TabsTrigger value="documents">{labels.tabDocuments}</TabsTrigger>
                  <TabsTrigger value="activity">{labels.tabActivity}</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  <OverviewPanel application={application} labels={labels} locale={locale} />
                </TabsContent>
                <TabsContent value="documents">
                  <DocumentsPanel
                    application={application}
                    labels={labels}
                    locale={locale}
                    onDownload={onDownloadDocument}
                    onRemove={onRemoveDocument}
                    onUpload={onUpload}
                  />
                </TabsContent>
                <TabsContent value="activity">
                  <ActivityPanel application={application} labels={labels} locale={locale} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </StateWrapper>
      </div>
    </div>
  );
}

export { DetailPage01 };
export type { DetailPage01Props, DetailPage01Tab };

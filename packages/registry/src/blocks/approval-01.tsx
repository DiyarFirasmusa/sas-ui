import { useMemo, useState } from 'react';
import {
  currentStageIndex,
  formatDateTime,
  overallOutcome,
  sampleApprovalRequest,
  type ApprovalAction,
  type ApprovalDecision,
  type ApprovalDecisionInput,
  type ApprovalOutcome,
  type ApprovalRequest,
} from '@/components/blocks/approval-01-data';
import { DecisionDialog } from '@/components/blocks/approval-01-dialog';
import {
  closedLabel,
  decisionLabel,
  messages,
  outcomeLabel,
  type Approval01Labels,
} from '@/components/blocks/approval-01-messages';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataBadge, type DataBadgeStatus } from '@/components/ui/data-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ArrowLeftIcon, CheckIcon, ClockIcon, CloseIcon } from '@/components/ui/icons';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StateWrapper, type AsyncState } from '@/components/ui/state-wrapper';
import { Timeline, TimelineItem, type TimelineItemProps } from '@/components/ui/timeline';
import { fillTemplate } from '@/lib/format-message';
import { useLabels, useLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';

const ALL_ACTIONS: readonly ApprovalAction[] = ['approve', 'reject', 'return'];
const DECISIONS: readonly ApprovalDecision[] = ['approved', 'rejected', 'returned', 'pending'];
const OUTCOMES: readonly ApprovalOutcome[] = ['pending', 'approved', 'rejected', 'returned'];

const DECISION_BADGE: Record<ApprovalDecision, DataBadgeStatus['tone']> = {
  approved: 'green',
  rejected: 'red',
  returned: 'orange',
  pending: 'neutral',
};
const OUTCOME_BADGE: Record<ApprovalOutcome, DataBadgeStatus['tone']> = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
  returned: 'orange',
};
const MARKER_TONE: Record<ApprovalDecision, NonNullable<TimelineItemProps['tone']>> = {
  approved: 'success',
  rejected: 'danger',
  returned: 'warning',
  pending: 'neutral',
};
const CLOSED_ALERT = {
  approved: 'success',
  rejected: 'danger',
  returned: 'warning',
  pending: 'info',
} as const;

function DecisionIcon({ decision }: { decision: ApprovalDecision }) {
  switch (decision) {
    case 'approved':
      return <CheckIcon />;
    case 'rejected':
      return <CloseIcon />;
    case 'returned':
      return <ArrowLeftIcon />;
    case 'pending':
      return <ClockIcon />;
  }
}

interface Approval01Props extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** The request and its stages as an async result. Defaults to a sample request. */
  state?: AsyncState<ApprovalRequest>;
  onRetry?: () => void;
  /** Whether the signed-in user may decide the current stage. Default true. */
  canAct?: boolean;
  /** Actions that cannot be confirmed without a comment. Default: all three. */
  requireComment?: readonly ApprovalAction[];
  /** Resolve to close the dialog; reject to keep it open with the error. */
  onDecision?: (input: ApprovalDecisionInput) => void | Promise<void>;
  labels?: Partial<Approval01Labels>;
}

function WorkflowSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="gap-row flex flex-col">
      <Skeleton className="h-8 w-72 max-w-full" />
      <div className="gap-row grid lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="h-96" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

/**
 * Approval and audit trail: the workflow stages as a vertical timeline with
 * approver, decision, time and comment, and a panel to Approve, Reject or
 * Return the stage that is waiting. Each action asks for a comment first.
 * On phones the panel comes before the timeline.
 */
function Approval01({
  state = { status: 'success', data: sampleApprovalRequest },
  onRetry,
  canAct = true,
  requireComment = ALL_ACTIONS,
  onDecision,
  labels: overrides,
  className,
  ...props
}: Approval01Props) {
  const labels = useLabels(messages, overrides);
  const { locale } = useLocale();
  const [action, setAction] = useState<ApprovalAction | null>(null);
  const decisionMap = useMemo<Record<string, DataBadgeStatus>>(
    () =>
      Object.fromEntries(
        DECISIONS.map((decision) => [
          decision,
          { tone: DECISION_BADGE[decision], label: decisionLabel(labels, decision) },
        ]),
      ),
    [labels],
  );
  const outcomeMap = useMemo<Record<string, DataBadgeStatus>>(
    () =>
      Object.fromEntries(
        OUTCOMES.map((outcome) => [
          outcome,
          { tone: OUTCOME_BADGE[outcome], label: outcomeLabel(labels, outcome) },
        ]),
      ),
    [labels],
  );

  function body(request: ApprovalRequest) {
    const outcome = overallOutcome(request.stages);
    const currentIndex = currentStageIndex(request.stages);
    const current = request.stages[currentIndex];

    return (
      <>
        <PageHeader
          title={<span dir="auto">{request.title[locale]}</span>}
          badge={<DataBadge value={outcome} statusMap={outcomeMap} />}
          subtitle={
            <>
              <span dir="ltr">{request.reference}</span>
              {' · '}
              {fillTemplate(labels.requestedBy, {
                name: request.requester[locale],
                date: formatDateTime(request.submittedAt, locale),
              })}
            </>
          }
        />
        <div className="gap-row grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <Card>
            <CardHeader>
              <CardTitle as="h2">{labels.timelineTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline aria-label={labels.timelineLabel}>
                {request.stages.map((stage, index) => (
                  <TimelineItem
                    key={stage.id}
                    aria-current={index === currentIndex ? 'step' : undefined}
                    title={stage.name[locale]}
                    time={stage.decidedAt ? formatDateTime(stage.decidedAt, locale) : undefined}
                    dateTime={stage.decidedAt}
                    tone={index === currentIndex ? 'primary' : MARKER_TONE[stage.decision]}
                    icon={<DecisionIcon decision={stage.decision} />}
                  >
                    <div className="gap-x-inline gap-y-field flex flex-wrap items-center">
                      <span className="text-b2 text-text-primary" dir="auto">
                        {stage.approver[locale]}
                      </span>
                      <span className="text-b3 text-text-muted" dir="auto">
                        {stage.role[locale]}
                      </span>
                      <DataBadge value={stage.decision} statusMap={decisionMap} />
                      {index === currentIndex ? (
                        <Badge tone="primary">{labels.currentStage}</Badge>
                      ) : null}
                    </div>
                    {stage.comment ? (
                      <blockquote
                        dir="auto"
                        className="border-stroke ps-inline text-b2 text-text-secondary border-s-2"
                      >
                        {stage.comment[locale]}
                      </blockquote>
                    ) : null}
                    {index === currentIndex && !stage.decidedAt ? (
                      <p className="text-b3 text-text-muted">{labels.awaiting}</p>
                    ) : null}
                  </TimelineItem>
                ))}
              </Timeline>
            </CardContent>
          </Card>
          <aside className="lg:top-row max-lg:order-first lg:sticky">
            {current ? (
              canAct ? (
                <Card>
                  <CardHeader>
                    <CardTitle as="h2">{labels.panelTitle}</CardTitle>
                    <CardDescription>
                      {fillTemplate(labels.panelDescription, { stage: current.name[locale] })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="gap-field flex flex-wrap">
                    <Button className="max-sm:flex-1" onClick={() => setAction('approve')}>
                      <CheckIcon />
                      {labels.approve}
                    </Button>
                    <Button
                      className="max-sm:flex-1"
                      variant="outline"
                      onClick={() => setAction('return')}
                    >
                      <ArrowLeftIcon />
                      {labels.return}
                    </Button>
                    <Button
                      className="max-sm:flex-1"
                      variant="destructive"
                      onClick={() => setAction('reject')}
                    >
                      <CloseIcon />
                      {labels.reject}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Alert variant="info" description={labels.noPermission} />
              )
            ) : (
              <Alert variant={CLOSED_ALERT[outcome]} description={closedLabel(labels, outcome)} />
            )}
          </aside>
        </div>
        <DecisionDialog
          action={action}
          labels={labels}
          stageName={current?.name[locale] ?? ''}
          requireComment={requireComment}
          onClose={() => setAction(null)}
          onSubmit={async (chosen, comment) => {
            if (current) {
              await onDecision?.({ stageId: current.id, action: chosen, comment });
            }
          }}
        />
      </>
    );
  }

  return (
    <div className={cn('bg-background p-4 md:p-page min-h-svh', className)} {...props}>
      <div className="gap-card mx-auto flex w-full max-w-5xl flex-col">
        <StateWrapper
          state={state}
          isEmpty={(request) => request.stages.length === 0}
          empty={
            <EmptyState
              title={labels.emptyTitle}
              description={labels.emptyDescription}
              titleAs="h1"
            />
          }
          loading={<WorkflowSkeleton label={labels.loading} />}
          error={{ onRetry }}
        >
          {body}
        </StateWrapper>
      </div>
    </div>
  );
}

export { Approval01 };
export type { Approval01Props };

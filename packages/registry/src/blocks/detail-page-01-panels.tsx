import { useRef, useState } from 'react';
import {
  APPLICATION_STAGES,
  clampStage,
  formatDateTime,
  formatDay,
  type ActivityEntry,
  type Application,
  type ApplicationDocument,
} from '@/components/blocks/detail-page-01-data';
import {
  activityLabel,
  stageLabel,
  typeLabel,
  type DetailPage01Labels,
} from '@/components/blocks/detail-page-01-messages';
import { Alert } from '@/components/ui/alert';
import { AttachmentCard } from '@/components/ui/attachment-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DetailField, DetailGrid } from '@/components/ui/detail-field';
import { EmptyState } from '@/components/ui/empty-state';
import { FileUpload } from '@/components/ui/file-upload';
import { CheckIcon, CloseIcon, FileIcon, UserIcon } from '@/components/ui/icons';
import { Timeline, TimelineItem, type TimelineItemProps } from '@/components/ui/timeline';
import { fillTemplate, formatCount } from '@/lib/format-message';
import type { Locale } from '@/lib/locale';

interface PanelProps {
  application: Application;
  labels: DetailPage01Labels;
  locale: Locale;
}

/** Applicant and business sections beside a summary card; stacks on narrow screens. */
function OverviewPanel({ application, labels, locale }: PanelProps) {
  const stage = APPLICATION_STAGES[clampStage(application.stage)] ?? 'submitted';
  return (
    <div className="gap-row grid lg:grid-cols-3">
      <div className="gap-row flex flex-col lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">{labels.sectionApplicant}</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailGrid className="lg:grid-cols-2">
              <DetailField
                label={labels.applicant}
                value={<span dir="auto">{application.applicant[locale]}</span>}
              />
              <DetailField
                label={labels.email}
                value={<span dir="ltr">{application.email}</span>}
              />
              <DetailField
                label={labels.phone}
                value={<span dir="ltr">{application.phone}</span>}
              />
              <DetailField
                label={labels.address}
                value={<span dir="auto">{application.address[locale]}</span>}
              />
            </DetailGrid>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle as="h2">{labels.sectionBusiness}</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailGrid className="lg:grid-cols-2">
              <DetailField
                label={labels.businessActivity}
                value={<span dir="auto">{application.businessActivity[locale]}</span>}
              />
              <DetailField label={labels.type} value={typeLabel(labels, application.type)} />
              <DetailField label={labels.employees} value={formatCount(application.employees)} />
              <DetailField
                label={labels.submittedAt}
                value={formatDateTime(application.submittedAt, locale)}
              />
            </DetailGrid>
          </CardContent>
        </Card>
      </div>
      <Card className="self-start">
        <CardHeader>
          <CardTitle as="h2">{labels.summary}</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailGrid className="sm:grid-cols-1 lg:grid-cols-1">
            <DetailField
              label={labels.reference}
              value={<span dir="ltr">{application.reference}</span>}
            />
            <DetailField label={labels.currentStage} value={stageLabel(labels, stage)} />
            <DetailField
              label={labels.reviewer}
              icon={<UserIcon />}
              value={<span dir="auto">{application.reviewer[locale]}</span>}
            />
            <DetailField
              label={labels.fee}
              tone="boxed"
              value={
                <span className="tabular-nums" dir="ltr">
                  {formatCount(application.fee)} {labels.feeUnit}
                </span>
              }
            />
            <DetailField label={labels.dueDate} value={formatDay(application.dueDate, locale)} />
          </DetailGrid>
        </CardContent>
      </Card>
    </div>
  );
}

interface DocumentsPanelProps extends PanelProps {
  onDownload?: (document: ApplicationDocument) => void;
  onRemove?: (document: ApplicationDocument) => void;
  onUpload?: (files: File[]) => void | Promise<void>;
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function DocumentsPanel({
  application,
  labels,
  locale,
  onDownload,
  onRemove,
  onUpload,
}: DocumentsPanelProps) {
  const [queued, setQueued] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [failed, setFailed] = useState(false);
  // The ref closes the gap between a click and the re-render that disables the button.
  const inFlight = useRef(false);

  async function upload() {
    if (inFlight.current || queued.length === 0) {
      return;
    }
    inFlight.current = true;
    setUploading(true);
    setFailed(false);
    try {
      await onUpload?.(queued);
      setQueued([]);
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
      setUploading(false);
    }
  }

  return (
    <div className="gap-row flex flex-col">
      <Card>
        <CardHeader>
          <CardTitle as="h2">{labels.documentsTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {application.documents.length === 0 ? (
            <EmptyState
              icon={<FileIcon />}
              title={labels.documentsEmptyTitle}
              description={onUpload ? labels.documentsEmptyDescription : undefined}
              titleAs="h3"
            />
          ) : (
            <ul className="gap-inline grid lg:grid-cols-2" role="list">
              {application.documents.map((document) => (
                <li key={document.id} className="min-w-0">
                  <AttachmentCard
                    name={document.name}
                    size={document.size}
                    meta={fillTemplate(labels.uploadedBy, {
                      name: document.uploadedBy[locale],
                      date: formatDateTime(document.uploadedAt, locale),
                    })}
                    onDownload={onDownload ? () => onDownload(document) : undefined}
                    onRemove={onRemove ? () => onRemove(document) : undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      {onUpload ? (
        <Card>
          <CardHeader>
            <CardTitle as="h2">{labels.uploadTitle}</CardTitle>
          </CardHeader>
          <CardContent className="gap-row flex flex-col">
            {failed ? <Alert variant="danger" description={labels.uploadFailed} /> : null}
            <FileUpload
              multiple
              maxSize={MAX_UPLOAD_BYTES}
              value={queued}
              onValueChange={setQueued}
              disabled={uploading}
              aria-label={labels.uploadTitle}
            />
            {queued.length > 0 ? (
              <Button
                className="self-start"
                loading={uploading}
                onClick={() => {
                  void upload();
                }}
              >
                {fillTemplate(labels.uploadAction, { count: formatCount(queued.length) })}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

const ACTIVITY_TONES: Record<ActivityEntry['kind'], NonNullable<TimelineItemProps['tone']>> = {
  created: 'neutral',
  submitted: 'primary',
  document: 'info',
  comment: 'neutral',
  approved: 'success',
  rejected: 'danger',
};

function ActivityPanel({ application, labels, locale }: PanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">{labels.activityTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <Timeline
          empty={
            <EmptyState
              title={labels.activityEmptyTitle}
              description={labels.activityEmptyDescription}
              titleAs="h3"
            />
          }
        >
          {application.activity.map((entry) => (
            <TimelineItem
              key={entry.id}
              title={`${activityLabel(labels, entry.kind)} · ${entry.actor[locale]}`}
              time={formatDateTime(entry.at, locale)}
              dateTime={entry.at}
              tone={ACTIVITY_TONES[entry.kind]}
              icon={
                entry.kind === 'approved' ? (
                  <CheckIcon />
                ) : entry.kind === 'rejected' ? (
                  <CloseIcon />
                ) : undefined
              }
              description={entry.note ? <span dir="auto">{entry.note[locale]}</span> : undefined}
            />
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
}

export { ActivityPanel, DocumentsPanel, OverviewPanel };
export type { DocumentsPanelProps, PanelProps };

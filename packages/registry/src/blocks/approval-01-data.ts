import { resolveIntlLocale } from '@/lib/date-utils';
import type { Locale } from '@/lib/locale';

type ApprovalDecision = 'approved' | 'rejected' | 'returned' | 'pending';
/** What an approver can do with the stage waiting on them. */
type ApprovalAction = 'approve' | 'reject' | 'return';
type ApprovalOutcome = 'pending' | 'approved' | 'rejected' | 'returned';

/** Names are data, not UI chrome: keep both spellings and pick one by locale. */
type Localized = Record<Locale, string>;

interface ApprovalStage {
  id: string;
  name: Localized;
  approver: Localized;
  role: Localized;
  decision: ApprovalDecision;
  /** ISO timestamp; only set once a decision was made. */
  decidedAt?: string;
  comment?: Localized;
}

interface ApprovalRequest {
  id: string;
  reference: string;
  title: Localized;
  requester: Localized;
  /** ISO timestamp. */
  submittedAt: string;
  stages: ApprovalStage[];
}

/** What the dialog hands to `onDecision`. */
interface ApprovalDecisionInput {
  stageId: string;
  action: ApprovalAction;
  comment: string;
}

const sampleApprovalRequest: ApprovalRequest = {
  id: 'req-1042',
  reference: 'LIC-1042',
  title: { en: 'Commercial licence renewal', ar: 'تجديد ترخيص تجاري' },
  requester: { en: 'Al Noor Trading Co.', ar: 'شركة النور للتجارة' },
  submittedAt: '2026-11-01T08:30:00Z',
  stages: [
    {
      id: 'st-1',
      name: { en: 'Document check', ar: 'فحص المستندات' },
      approver: { en: 'Omar Al-Jabouri', ar: 'عمر الجبوري' },
      role: { en: 'Compliance officer', ar: 'مسؤول الامتثال' },
      decision: 'approved',
      decidedAt: '2026-11-02T10:12:00Z',
      comment: { en: 'All documents verified.', ar: 'تم التحقق من جميع المستندات.' },
    },
    {
      id: 'st-2',
      name: { en: 'Technical review', ar: 'المراجعة الفنية' },
      approver: { en: 'Sara Al-Obaidi', ar: 'سارة العبيدي' },
      role: { en: 'Technical reviewer', ar: 'المراجع الفني' },
      decision: 'approved',
      decidedAt: '2026-11-05T14:45:00Z',
      comment: {
        en: 'Site visit confirms the warehouse matches the plan.',
        ar: 'أكدت زيارة الموقع أن المستودع مطابق للمخطط.',
      },
    },
    {
      id: 'st-3',
      name: { en: 'Finance approval', ar: 'اعتماد المالية' },
      approver: { en: 'Layla Hassan', ar: 'ليلى حسن' },
      role: { en: 'Finance manager', ar: 'مديرة المالية' },
      decision: 'pending',
    },
    {
      id: 'st-4',
      name: { en: 'Director sign-off', ar: 'مصادقة المدير' },
      approver: { en: 'Ahmed Saleh', ar: 'أحمد صالح' },
      role: { en: 'Director', ar: 'المدير العام' },
      decision: 'pending',
    },
  ],
};

/** Rejected beats returned beats pending; approved only when every stage is. */
function overallOutcome(stages: readonly ApprovalStage[]): ApprovalOutcome {
  if (stages.some((stage) => stage.decision === 'rejected')) {
    return 'rejected';
  }
  if (stages.some((stage) => stage.decision === 'returned')) {
    return 'returned';
  }
  return stages.length > 0 && stages.every((stage) => stage.decision === 'approved')
    ? 'approved'
    : 'pending';
}

/**
 * The stage waiting for a decision: the first pending one, and only while the
 * request is still open (a rejected or returned request waits for nobody).
 */
function currentStageIndex(stages: readonly ApprovalStage[]): number {
  return overallOutcome(stages) === 'pending'
    ? stages.findIndex((stage) => stage.decision === 'pending')
    : -1;
}

function decisionOf(action: ApprovalAction): Exclude<ApprovalDecision, 'pending'> {
  switch (action) {
    case 'approve':
      return 'approved';
    case 'reject':
      return 'rejected';
    case 'return':
      return 'returned';
  }
}

/** `Nov 5, 2026, 2:45 PM` with Latin digits in every language. */
function formatDateTime(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export { currentStageIndex, decisionOf, formatDateTime, overallOutcome, sampleApprovalRequest };
export type {
  ApprovalAction,
  ApprovalDecision,
  ApprovalDecisionInput,
  ApprovalOutcome,
  ApprovalRequest,
  ApprovalStage,
  Localized,
};

import { formatDate, parseISODate, resolveIntlLocale } from '@/lib/date-utils';
import type { Locale } from '@/lib/locale';

type ApplicationStatus = 'draft' | 'in-review' | 'approved' | 'rejected';
type ApplicationType = 'commercial' | 'professional' | 'vehicle' | 'event';
type ActivityKind = 'created' | 'submitted' | 'document' | 'comment' | 'approved' | 'rejected';

/** Names are data, not UI chrome: keep both spellings and pick one by locale. */
type Localized = Record<Locale, string>;

/** The workflow, in order. `Application.stage` indexes into it. */
const APPLICATION_STAGES = ['submitted', 'documents', 'review', 'approval', 'issued'] as const;
type ApplicationStage = (typeof APPLICATION_STAGES)[number];

interface ApplicationDocument {
  id: string;
  name: string;
  /** Bytes. */
  size: number;
  uploadedBy: Localized;
  /** ISO timestamp. */
  uploadedAt: string;
}

interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  actor: Localized;
  /** ISO timestamp. */
  at: string;
  note?: Localized;
}

interface Application {
  id: string;
  reference: string;
  applicant: Localized;
  type: ApplicationType;
  status: ApplicationStatus;
  /** Zero-based index into `APPLICATION_STAGES`: where the application is now. */
  stage: number;
  email: string;
  phone: string;
  address: Localized;
  businessActivity: Localized;
  employees: number;
  reviewer: Localized;
  /** Annual fee in Iraqi dinar. */
  fee: number;
  /** ISO timestamp. */
  submittedAt: string;
  /** `yyyy-mm-dd`. */
  dueDate: string;
  documents: ApplicationDocument[];
  activity: ActivityEntry[];
}

const sampleApplication: Application = {
  id: 'app-412',
  reference: 'APP-2026-0412',
  applicant: { en: 'Al Noor Trading Co.', ar: 'شركة النور للتجارة' },
  type: 'commercial',
  status: 'in-review',
  stage: 2,
  email: 'info@alnoor.example',
  phone: '+964 770 123 4567',
  address: { en: 'Al-Karrada, Baghdad', ar: 'الكرادة، بغداد' },
  businessActivity: {
    en: 'Wholesale of building materials',
    ar: 'تجارة الجملة بمواد البناء',
  },
  employees: 12,
  reviewer: { en: 'Sara Al-Obaidi', ar: 'سارة العبيدي' },
  fee: 450_000,
  submittedAt: '2026-10-28T09:14:00Z',
  dueDate: '2026-11-27',
  documents: [
    {
      id: 'doc-1',
      name: 'commercial-registration.pdf',
      size: 1_245_184,
      uploadedBy: { en: 'Al Noor Trading Co.', ar: 'شركة النور للتجارة' },
      uploadedAt: '2026-10-28T09:10:00Z',
    },
    {
      id: 'doc-2',
      name: 'عقد الإيجار.pdf',
      size: 532_480,
      uploadedBy: { en: 'Al Noor Trading Co.', ar: 'شركة النور للتجارة' },
      uploadedAt: '2026-10-28T09:12:00Z',
    },
    {
      id: 'doc-3',
      name: 'site-photos.zip',
      size: 8_912_896,
      uploadedBy: { en: 'Sara Al-Obaidi', ar: 'سارة العبيدي' },
      uploadedAt: '2026-11-03T13:40:00Z',
    },
  ],
  activity: [
    {
      id: 'act-5',
      kind: 'comment',
      actor: { en: 'Sara Al-Obaidi', ar: 'سارة العبيدي' },
      at: '2026-11-05T11:02:00Z',
      note: {
        en: 'Site visit done. Warehouse matches the plan; waiting on the fire certificate.',
        ar: 'تمت زيارة الموقع. المستودع مطابق للمخطط؛ بانتظار شهادة الدفاع المدني.',
      },
    },
    {
      id: 'act-4',
      kind: 'document',
      actor: { en: 'Sara Al-Obaidi', ar: 'سارة العبيدي' },
      at: '2026-11-03T13:40:00Z',
      note: { en: 'Added site-photos.zip', ar: 'أضافت site-photos.zip' },
    },
    {
      id: 'act-3',
      kind: 'approved',
      actor: { en: 'Omar Al-Jabouri', ar: 'عمر الجبوري' },
      at: '2026-10-30T08:25:00Z',
      note: { en: 'Documents are complete.', ar: 'المستندات مكتملة.' },
    },
    {
      id: 'act-2',
      kind: 'submitted',
      actor: { en: 'Al Noor Trading Co.', ar: 'شركة النور للتجارة' },
      at: '2026-10-28T09:14:00Z',
    },
    {
      id: 'act-1',
      kind: 'created',
      actor: { en: 'Al Noor Trading Co.', ar: 'شركة النور للتجارة' },
      at: '2026-10-28T08:50:00Z',
    },
  ],
};

/** `Nov 5, 2026, 11:02 AM` with Latin digits in every language. */
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

/** A `yyyy-mm-dd` day in the locale, or the raw text when it is not a real date. */
function formatDay(value: string, locale: Locale): string {
  const parsed = parseISODate(value);
  return parsed ? formatDate(parsed, { locale, dateStyle: 'medium' }) : value;
}

/** Clamps a stage index so a bad value from the backend cannot break the stepper. */
function clampStage(stage: number): number {
  return Math.min(Math.max(Math.trunc(stage), 0), APPLICATION_STAGES.length - 1);
}

export { APPLICATION_STAGES, clampStage, formatDateTime, formatDay, sampleApplication };
export type {
  ActivityEntry,
  ActivityKind,
  Application,
  ApplicationDocument,
  ApplicationStage,
  ApplicationStatus,
  ApplicationType,
  Localized,
};

import type {
  ActivityKind,
  ApplicationStage,
  ApplicationStatus,
  ApplicationType,
} from '@/components/blocks/detail-page-01-data';
import type { Messages } from '@/lib/locale';

const messages: Messages<
  | 'breadcrumbHome'
  | 'breadcrumbList'
  | 'edit'
  | 'delete'
  | 'deleteTitle'
  | 'deleteDescription'
  | 'deleteConfirm'
  | 'pipeline'
  | 'stageSubmitted'
  | 'stageDocuments'
  | 'stageReview'
  | 'stageApproval'
  | 'stageIssued'
  | 'tabOverview'
  | 'tabDocuments'
  | 'tabActivity'
  | 'statusDraft'
  | 'statusInReview'
  | 'statusApproved'
  | 'statusRejected'
  | 'sectionApplicant'
  | 'sectionBusiness'
  | 'applicant'
  | 'email'
  | 'phone'
  | 'address'
  | 'businessActivity'
  | 'type'
  | 'employees'
  | 'submittedAt'
  | 'summary'
  | 'summaryStage'
  | 'currentStage'
  | 'reference'
  | 'reviewer'
  | 'fee'
  | 'feeUnit'
  | 'dueDate'
  | 'typeCommercial'
  | 'typeProfessional'
  | 'typeVehicle'
  | 'typeEvent'
  | 'documentsTitle'
  | 'documentsEmptyTitle'
  | 'documentsEmptyDescription'
  | 'uploadTitle'
  | 'uploadAction'
  | 'uploadFailed'
  | 'uploadedBy'
  | 'activityTitle'
  | 'activityEmptyTitle'
  | 'activityEmptyDescription'
  | 'activityCreated'
  | 'activitySubmitted'
  | 'activityDocument'
  | 'activityComment'
  | 'activityApproved'
  | 'activityRejected'
  | 'loading'
> = {
  en: {
    breadcrumbHome: 'Home',
    breadcrumbList: 'Applications',
    edit: 'Edit',
    delete: 'Delete',
    deleteTitle: 'Delete this application?',
    deleteDescription: 'The application and its documents will be removed. This cannot be undone.',
    deleteConfirm: 'Delete application',
    pipeline: 'Workflow stage',
    stageSubmitted: 'Submitted',
    stageDocuments: 'Document check',
    stageReview: 'Technical review',
    stageApproval: 'Approval',
    stageIssued: 'Issued',
    tabOverview: 'Overview',
    tabDocuments: 'Documents',
    tabActivity: 'Activity',
    statusDraft: 'Draft',
    statusInReview: 'In review',
    statusApproved: 'Approved',
    statusRejected: 'Rejected',
    sectionApplicant: 'Applicant',
    sectionBusiness: 'Business',
    applicant: 'Applicant',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    businessActivity: 'Business activity',
    type: 'Licence type',
    employees: 'Employees',
    submittedAt: 'Submitted',
    summary: 'Summary',
    summaryStage: 'Stage {n} of {total}: {stage}',
    currentStage: 'Current stage',
    reference: 'Reference',
    reviewer: 'Assigned reviewer',
    fee: 'Annual fee',
    feeUnit: 'IQD',
    dueDate: 'Decision due',
    typeCommercial: 'Commercial',
    typeProfessional: 'Professional',
    typeVehicle: 'Vehicle',
    typeEvent: 'Event',
    documentsTitle: 'Attached documents',
    documentsEmptyTitle: 'No documents yet',
    documentsEmptyDescription: 'Upload the files this application needs below.',
    uploadTitle: 'Add documents',
    uploadAction: 'Upload {count} file(s)',
    uploadFailed: 'The upload failed. Try again.',
    uploadedBy: '{name} on {date}',
    activityTitle: 'Activity',
    activityEmptyTitle: 'No activity yet',
    activityEmptyDescription: 'Changes and comments will be listed here.',
    activityCreated: 'Application created',
    activitySubmitted: 'Application submitted',
    activityDocument: 'Document added',
    activityComment: 'Comment',
    activityApproved: 'Stage approved',
    activityRejected: 'Stage rejected',
    loading: 'Loading application',
  },
  ar: {
    breadcrumbHome: 'الرئيسية',
    breadcrumbList: 'الطلبات',
    edit: 'تعديل',
    delete: 'حذف',
    deleteTitle: 'حذف هذا الطلب؟',
    deleteDescription: 'سيُحذف الطلب ومستنداته. لا يمكن التراجع عن ذلك.',
    deleteConfirm: 'حذف الطلب',
    pipeline: 'مرحلة سير العمل',
    stageSubmitted: 'تم التقديم',
    stageDocuments: 'فحص المستندات',
    stageReview: 'المراجعة الفنية',
    stageApproval: 'الاعتماد',
    stageIssued: 'تم الإصدار',
    tabOverview: 'نظرة عامة',
    tabDocuments: 'المستندات',
    tabActivity: 'النشاط',
    statusDraft: 'مسودة',
    statusInReview: 'قيد المراجعة',
    statusApproved: 'معتمد',
    statusRejected: 'مرفوض',
    sectionApplicant: 'مقدّم الطلب',
    sectionBusiness: 'النشاط التجاري',
    applicant: 'مقدّم الطلب',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    address: 'العنوان',
    businessActivity: 'نوع النشاط',
    type: 'نوع الترخيص',
    employees: 'عدد الموظفين',
    submittedAt: 'تاريخ التقديم',
    summary: 'الملخص',
    summaryStage: 'المرحلة {n} من {total}: {stage}',
    currentStage: 'المرحلة الحالية',
    reference: 'الرقم المرجعي',
    reviewer: 'المراجع المسؤول',
    fee: 'الرسم السنوي',
    feeUnit: 'د.ع',
    dueDate: 'موعد القرار',
    typeCommercial: 'تجاري',
    typeProfessional: 'مهني',
    typeVehicle: 'مركبة',
    typeEvent: 'فعالية',
    documentsTitle: 'المستندات المرفقة',
    documentsEmptyTitle: 'لا توجد مستندات بعد',
    documentsEmptyDescription: 'ارفع الملفات التي يحتاجها هذا الطلب أدناه.',
    uploadTitle: 'إضافة مستندات',
    uploadAction: 'رفع {count} من الملفات',
    uploadFailed: 'فشل الرفع. حاول مرة أخرى.',
    uploadedBy: '{name} في {date}',
    activityTitle: 'النشاط',
    activityEmptyTitle: 'لا يوجد نشاط بعد',
    activityEmptyDescription: 'ستُعرض التغييرات والتعليقات هنا.',
    activityCreated: 'تم إنشاء الطلب',
    activitySubmitted: 'تم تقديم الطلب',
    activityDocument: 'تمت إضافة مستند',
    activityComment: 'تعليق',
    activityApproved: 'تم اعتماد المرحلة',
    activityRejected: 'تم رفض المرحلة',
    loading: 'جارٍ تحميل الطلب',
  },
};

type DetailPage01Labels = Record<keyof (typeof messages)['en'], string>;

function stageLabel(labels: DetailPage01Labels, stage: ApplicationStage): string {
  switch (stage) {
    case 'submitted':
      return labels.stageSubmitted;
    case 'documents':
      return labels.stageDocuments;
    case 'review':
      return labels.stageReview;
    case 'approval':
      return labels.stageApproval;
    case 'issued':
      return labels.stageIssued;
  }
}

function statusLabel(labels: DetailPage01Labels, status: ApplicationStatus): string {
  switch (status) {
    case 'draft':
      return labels.statusDraft;
    case 'in-review':
      return labels.statusInReview;
    case 'approved':
      return labels.statusApproved;
    case 'rejected':
      return labels.statusRejected;
  }
}

function typeLabel(labels: DetailPage01Labels, type: ApplicationType): string {
  switch (type) {
    case 'commercial':
      return labels.typeCommercial;
    case 'professional':
      return labels.typeProfessional;
    case 'vehicle':
      return labels.typeVehicle;
    case 'event':
      return labels.typeEvent;
  }
}

function activityLabel(labels: DetailPage01Labels, kind: ActivityKind): string {
  switch (kind) {
    case 'created':
      return labels.activityCreated;
    case 'submitted':
      return labels.activitySubmitted;
    case 'document':
      return labels.activityDocument;
    case 'comment':
      return labels.activityComment;
    case 'approved':
      return labels.activityApproved;
    case 'rejected':
      return labels.activityRejected;
  }
}

export { activityLabel, messages, stageLabel, statusLabel, typeLabel };
export type { DetailPage01Labels };

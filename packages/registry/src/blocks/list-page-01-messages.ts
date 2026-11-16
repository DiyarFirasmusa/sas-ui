import type { Licence, LicenceStatus } from '@/components/blocks/list-page-01-data';
import type { Messages } from '@/lib/locale';

const messages: Messages<
  | 'title'
  | 'description'
  | 'create'
  | 'caption'
  | 'searchPlaceholder'
  | 'reference'
  | 'holder'
  | 'type'
  | 'status'
  | 'expires'
  | 'fee'
  | 'feeUnit'
  | 'actionsFor'
  | 'view'
  | 'renew'
  | 'suspend'
  | 'export'
  | 'exportSelected'
  | 'suspendSelected'
  | 'confirmTitle'
  | 'confirmDescription'
  | 'confirmAction'
  | 'emptyTitle'
  | 'emptyDescription'
  | 'noResultsTitle'
  | 'noResultsDescription'
  | 'loadError'
  | 'summary'
  | 'statTotal'
  | 'statusActive'
  | 'statusPending'
  | 'statusSuspended'
  | 'statusExpired'
  | 'typeCommercial'
  | 'typeProfessional'
  | 'typeVehicle'
  | 'typeEvent'
> = {
  en: {
    title: 'Licences',
    description: 'Issue, renew and suspend licences, and watch what is about to expire.',
    create: 'New licence',
    caption: 'Licences',
    searchPlaceholder: 'Search by reference or holder',
    reference: 'Reference',
    holder: 'Holder',
    type: 'Type',
    status: 'Status',
    expires: 'Expires',
    fee: 'Annual fee',
    feeUnit: 'IQD',
    actionsFor: 'Actions for {reference}',
    view: 'View',
    renew: 'Renew',
    suspend: 'Suspend',
    export: 'Export',
    exportSelected: 'Export',
    suspendSelected: 'Suspend',
    confirmTitle: 'Suspend licences?',
    confirmDescription:
      '{count} selected. Holders lose the right to operate until a reviewer reinstates them. This is recorded in the audit trail.',
    confirmAction: 'Suspend',
    emptyTitle: 'No licences yet',
    emptyDescription: 'Issued licences will appear here.',
    noResultsTitle: 'No licences match',
    noResultsDescription: 'Try a different search or clear the filters.',
    loadError: 'We could not load the licences.',
    summary: 'Summary',
    statTotal: 'All licences',
    statusActive: 'Active',
    statusPending: 'Pending review',
    statusSuspended: 'Suspended',
    statusExpired: 'Expired',
    typeCommercial: 'Commercial',
    typeProfessional: 'Professional',
    typeVehicle: 'Vehicle',
    typeEvent: 'Event',
  },
  ar: {
    title: 'التراخيص',
    description: 'أصدر التراخيص وجدّدها وعلّقها، وتابع ما يقترب من الانتهاء.',
    create: 'ترخيص جديد',
    caption: 'التراخيص',
    searchPlaceholder: 'ابحث بالرقم المرجعي أو اسم الحامل',
    reference: 'الرقم المرجعي',
    holder: 'الحامل',
    type: 'النوع',
    status: 'الحالة',
    expires: 'تاريخ الانتهاء',
    fee: 'الرسم السنوي',
    feeUnit: 'د.ع',
    actionsFor: 'إجراءات {reference}',
    view: 'عرض',
    renew: 'تجديد',
    suspend: 'تعليق',
    export: 'تصدير',
    exportSelected: 'تصدير',
    suspendSelected: 'تعليق',
    confirmTitle: 'تعليق التراخيص؟',
    confirmDescription:
      'المحدد: {count}. يفقد الحاملون حق المزاولة حتى يعيد المراجع تفعيلها. يُسجَّل ذلك في سجل التدقيق.',
    confirmAction: 'تعليق',
    emptyTitle: 'لا توجد تراخيص بعد',
    emptyDescription: 'ستظهر التراخيص الصادرة هنا.',
    noResultsTitle: 'لا توجد تراخيص مطابقة',
    noResultsDescription: 'جرّب بحثًا مختلفًا أو أزل عوامل التصفية.',
    loadError: 'تعذّر تحميل التراخيص.',
    summary: 'الملخص',
    statTotal: 'كل التراخيص',
    statusActive: 'سارٍ',
    statusPending: 'قيد المراجعة',
    statusSuspended: 'معلّق',
    statusExpired: 'منتهٍ',
    typeCommercial: 'تجاري',
    typeProfessional: 'مهني',
    typeVehicle: 'مركبة',
    typeEvent: 'فعالية',
  },
};

function statusLabelKey(status: LicenceStatus) {
  switch (status) {
    case 'active':
      return 'statusActive';
    case 'pending':
      return 'statusPending';
    case 'suspended':
      return 'statusSuspended';
    case 'expired':
      return 'statusExpired';
  }
}

function typeLabelKey(type: Licence['type']) {
  switch (type) {
    case 'commercial':
      return 'typeCommercial';
    case 'professional':
      return 'typeProfessional';
    case 'vehicle':
      return 'typeVehicle';
    case 'event':
      return 'typeEvent';
  }
}

export { messages, statusLabelKey, typeLabelKey };

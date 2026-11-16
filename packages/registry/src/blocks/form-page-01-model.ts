import { z } from 'zod';
import type { ComboboxOption } from '@/lib/combobox-options';
import type { Locale, Messages } from '@/lib/locale';

const messages: Messages<
  | 'title'
  | 'subtitle'
  | 'identityTitle'
  | 'identityDescription'
  | 'fullName'
  | 'nationalId'
  | 'nationalIdHint'
  | 'contactTitle'
  | 'contactDescription'
  | 'email'
  | 'phone'
  | 'phoneHint'
  | 'addressTitle'
  | 'addressDescription'
  | 'governorate'
  | 'governoratePlaceholder'
  | 'addressLine'
  | 'datesTitle'
  | 'datesDescription'
  | 'birthDate'
  | 'startDate'
  | 'endDate'
  | 'attachmentsTitle'
  | 'attachmentsDescription'
  | 'attachments'
  | 'notesTitle'
  | 'notesDescription'
  | 'notes'
  | 'notesPlaceholder'
  | 'cancel'
  | 'saveDraft'
  | 'submit'
  | 'unsaved'
  | 'draftSaved'
  | 'submitted'
  | 'submitFailed'
  | 'draftFailed'
  | 'discardTitle'
  | 'discardDescription'
  | 'discardConfirm'
  | 'keepEditing'
  | 'nameRequired'
  | 'idInvalid'
  | 'emailRequired'
  | 'emailInvalid'
  | 'phoneInvalid'
  | 'governorateRequired'
  | 'addressRequired'
  | 'birthRequired'
  | 'startRequired'
  | 'endBeforeStart'
  | 'notesTooLong'
> = {
  en: {
    title: 'New employee',
    subtitle: 'Fill in the record. You can save a draft and come back later.',
    identityTitle: 'Identity',
    identityDescription: 'Name and national ID as written on the official document.',
    fullName: 'Full name',
    nationalId: 'National ID',
    nationalIdHint: '12 digits, Latin numerals',
    contactTitle: 'Contact',
    contactDescription: 'How we reach the employee.',
    email: 'Email',
    phone: 'Mobile phone',
    phoneHint: 'Format: +964 7XX XXX XXXX',
    addressTitle: 'Address',
    addressDescription: 'Where the employee lives.',
    governorate: 'Governorate',
    governoratePlaceholder: 'Choose a governorate',
    addressLine: 'Street and district',
    datesTitle: 'Dates',
    datesDescription: 'Birth date and the contract period.',
    birthDate: 'Date of birth',
    startDate: 'Contract start',
    endDate: 'Contract end',
    attachmentsTitle: 'Attachments',
    attachmentsDescription: 'ID copy, contract and certificates. PDF or images, up to 5 MB each.',
    attachments: 'Supporting documents',
    notesTitle: 'Notes',
    notesDescription: 'Anything the reviewer should know.',
    notes: 'Notes',
    notesPlaceholder: 'Write a note…',
    cancel: 'Cancel',
    saveDraft: 'Save draft',
    submit: 'Submit',
    unsaved: 'You have unsaved changes',
    draftSaved: 'Draft saved.',
    submitted: 'Submitted for review.',
    submitFailed: 'We could not submit the form. Try again.',
    draftFailed: 'We could not save the draft. Try again.',
    discardTitle: 'Discard your changes?',
    discardDescription: 'You have unsaved changes. If you leave now they will be lost.',
    discardConfirm: 'Discard changes',
    keepEditing: 'Keep editing',
    nameRequired: 'Enter the full name',
    idInvalid: 'Enter exactly 12 digits',
    emailRequired: 'Enter an email address',
    emailInvalid: 'Enter a valid email address',
    phoneInvalid: 'Use the format +964 7XX XXX XXXX',
    governorateRequired: 'Choose a governorate',
    addressRequired: 'Enter the street and district',
    birthRequired: 'Choose the date of birth',
    startRequired: 'Choose the contract start',
    endBeforeStart: 'The end date must be on or after the start date',
    notesTooLong: 'Notes are limited to 500 characters',
  },
  ar: {
    title: 'موظف جديد',
    subtitle: 'املأ السجل. يمكنك حفظ مسودة والعودة لاحقاً.',
    identityTitle: 'الهوية',
    identityDescription: 'الاسم والرقم الوطني كما في الوثيقة الرسمية.',
    fullName: 'الاسم الكامل',
    nationalId: 'الرقم الوطني',
    nationalIdHint: '١٢ رقماً، بالأرقام اللاتينية',
    contactTitle: 'التواصل',
    contactDescription: 'كيف نتواصل مع الموظف.',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف المحمول',
    phoneHint: 'الصيغة: +964 7XX XXX XXXX',
    addressTitle: 'العنوان',
    addressDescription: 'مكان سكن الموظف.',
    governorate: 'المحافظة',
    governoratePlaceholder: 'اختر المحافظة',
    addressLine: 'الشارع والحي',
    datesTitle: 'التواريخ',
    datesDescription: 'تاريخ الميلاد ومدة العقد.',
    birthDate: 'تاريخ الميلاد',
    startDate: 'بداية العقد',
    endDate: 'نهاية العقد',
    attachmentsTitle: 'المرفقات',
    attachmentsDescription:
      'صورة الهوية والعقد والشهادات. ملفات PDF أو صور، حتى ٥ ميغابايت لكل ملف.',
    attachments: 'المستندات الداعمة',
    notesTitle: 'الملاحظات',
    notesDescription: 'أي شيء يجب أن يعرفه المراجع.',
    notes: 'الملاحظات',
    notesPlaceholder: 'اكتب ملاحظة…',
    cancel: 'إلغاء',
    saveDraft: 'حفظ كمسودة',
    submit: 'إرسال',
    unsaved: 'لديك تغييرات غير محفوظة',
    draftSaved: 'تم حفظ المسودة.',
    submitted: 'تم الإرسال للمراجعة.',
    submitFailed: 'تعذّر إرسال النموذج. حاول مرة أخرى.',
    draftFailed: 'تعذّر حفظ المسودة. حاول مرة أخرى.',
    discardTitle: 'تجاهل تغييراتك؟',
    discardDescription: 'لديك تغييرات غير محفوظة. إذا غادرت الآن فستفقدها.',
    discardConfirm: 'تجاهل التغييرات',
    keepEditing: 'متابعة التعديل',
    nameRequired: 'أدخل الاسم الكامل',
    idInvalid: 'أدخل ١٢ رقماً بالضبط',
    emailRequired: 'أدخل البريد الإلكتروني',
    emailInvalid: 'أدخل بريداً إلكترونياً صحيحاً',
    phoneInvalid: 'استخدم الصيغة +964 7XX XXX XXXX',
    governorateRequired: 'اختر المحافظة',
    addressRequired: 'أدخل الشارع والحي',
    birthRequired: 'اختر تاريخ الميلاد',
    startRequired: 'اختر بداية العقد',
    endBeforeStart: 'يجب أن يكون تاريخ النهاية في أو بعد تاريخ البداية',
    notesTooLong: 'الملاحظات محدودة بـ ٥٠٠ حرف',
  },
};

type FormPage01Labels = Record<keyof (typeof messages)['en'], string>;

/** Sample governorates; the value is a stable slug, the label follows the UI language. */
const GOVERNORATES: Record<Locale, readonly ComboboxOption[]> = {
  en: [
    { value: 'baghdad', label: 'Baghdad' },
    { value: 'basra', label: 'Basra' },
    { value: 'erbil', label: 'Erbil' },
    { value: 'sulaymaniyah', label: 'Sulaymaniyah' },
    { value: 'duhok', label: 'Duhok' },
    { value: 'najaf', label: 'Najaf' },
    { value: 'nineveh', label: 'Nineveh' },
  ],
  ar: [
    { value: 'baghdad', label: 'بغداد' },
    { value: 'basra', label: 'البصرة' },
    { value: 'erbil', label: 'أربيل' },
    { value: 'sulaymaniyah', label: 'السليمانية' },
    { value: 'duhok', label: 'دهوك' },
    { value: 'najaf', label: 'النجف' },
    { value: 'nineveh', label: 'نينوى' },
  ],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_NOTES = 500;
const PHONE_PATTERN = /^\+964\s?7\d{2}\s?\d{3}\s?\d{4}$/;

/** The field names, in page order; also what `applyServerErrors` may target. */
const FIELD_NAMES = [
  'fullName',
  'nationalId',
  'email',
  'phone',
  'governorate',
  'addressLine',
  'birthDate',
  'startDate',
  'endDate',
  'attachments',
  'notes',
] as const;

function createSchema(labels: FormPage01Labels) {
  return z
    .object({
      fullName: z.string().trim().min(1, labels.nameRequired),
      nationalId: z.string().regex(/^\d{12}$/, labels.idInvalid),
      email: z.string().min(1, labels.emailRequired).pipe(z.email(labels.emailInvalid)),
      phone: z.string().regex(PHONE_PATTERN, labels.phoneInvalid),
      governorate: z.string().min(1, labels.governorateRequired),
      addressLine: z.string().trim().min(1, labels.addressRequired),
      birthDate: z.string().min(1, labels.birthRequired),
      startDate: z.string().min(1, labels.startRequired),
      // Optional: open-ended contracts have no end.
      endDate: z.string(),
      attachments: z.array(z.instanceof(File)),
      notes: z.string().max(MAX_NOTES, labels.notesTooLong),
    })
    .refine((values) => values.endDate === '' || values.endDate >= values.startDate, {
      path: ['endDate'],
      message: labels.endBeforeStart,
    });
}

type FormPage01Values = z.infer<ReturnType<typeof createSchema>>;

const EMPTY_VALUES: FormPage01Values = {
  fullName: '',
  nationalId: '',
  email: '',
  phone: '+964 ',
  governorate: '',
  addressLine: '',
  birthDate: '',
  startDate: '',
  endDate: '',
  attachments: [],
  notes: '',
};

/** Backend rejections are plain data: a validation payload (object or string) or an `Error`. */
function serverPayload(thrown: unknown): unknown {
  return thrown instanceof Error ? thrown.message : thrown;
}

/**
 * Default `onSubmit` of the block: a fake server that takes a moment and
 * refuses one known email with a Django/Laravel-style validation payload, so
 * the field-level mapping can be seen without a backend.
 */
async function demoSubmit(values: FormPage01Values, locale: Locale): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  if (values.email.toLowerCase() === 'taken@example.com') {
    const taken: Record<Locale, string> = {
      en: 'This email is already registered to another employee.',
      ar: 'هذا البريد الإلكتروني مسجّل لموظف آخر.',
    };
    return Promise.reject({ errors: { email: [taken[locale]] } });
  }
}

export {
  EMPTY_VALUES,
  FIELD_NAMES,
  GOVERNORATES,
  MAX_FILE_SIZE,
  MAX_NOTES,
  createSchema,
  demoSubmit,
  messages,
  serverPayload,
};
export type { FormPage01Labels, FormPage01Values };

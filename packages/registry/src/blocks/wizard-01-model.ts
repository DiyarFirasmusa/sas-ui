import { z } from 'zod';
import type { ComboboxOption } from '@/lib/combobox-options';
import type { Locale, Messages } from '@/lib/locale';

const messages: Messages<
  | 'title'
  | 'subtitle'
  | 'stepsLabel'
  | 'accountStep'
  | 'accountDescription'
  | 'organisationStep'
  | 'organisationDescription'
  | 'planStep'
  | 'planDescription'
  | 'reviewStep'
  | 'reviewDescription'
  | 'fullName'
  | 'email'
  | 'phone'
  | 'phoneHint'
  | 'orgName'
  | 'orgType'
  | 'orgTypePlaceholder'
  | 'governorate'
  | 'governoratePlaceholder'
  | 'plan'
  | 'language'
  | 'newsletter'
  | 'newsletterDescription'
  | 'terms'
  | 'yes'
  | 'no'
  | 'edit'
  | 'back'
  | 'next'
  | 'submit'
  | 'nameRequired'
  | 'emailRequired'
  | 'emailInvalid'
  | 'phoneInvalid'
  | 'orgNameRequired'
  | 'orgTypeRequired'
  | 'governorateRequired'
  | 'termsRequired'
  | 'submitFailed'
  | 'doneTitle'
  | 'doneDescription'
  | 'startOver'
> = {
  en: {
    title: 'Create your workspace',
    subtitle: 'Four short steps. Your answers are kept while you move between them.',
    stepsLabel: 'Setup steps',
    accountStep: 'Account',
    accountDescription: 'Who is setting this up?',
    organisationStep: 'Organisation',
    organisationDescription: 'Tell us about your organisation.',
    planStep: 'Plan',
    planDescription: 'Pick a plan and your defaults.',
    reviewStep: 'Review',
    reviewDescription: 'Check everything before you submit.',
    fullName: 'Full name',
    email: 'Work email',
    phone: 'Mobile phone',
    phoneHint: 'Format: +964 7XX XXX XXXX',
    orgName: 'Organisation name',
    orgType: 'Organisation type',
    orgTypePlaceholder: 'Choose a type',
    governorate: 'Governorate',
    governoratePlaceholder: 'Choose a governorate',
    plan: 'Plan',
    language: 'Default language',
    newsletter: 'Product updates',
    newsletterDescription: 'Occasional emails about new features.',
    terms: 'I confirm the details above and accept the terms of service',
    yes: 'Yes',
    no: 'No',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    submit: 'Create workspace',
    nameRequired: 'Enter your full name',
    emailRequired: 'Enter your work email',
    emailInvalid: 'Enter a valid email address',
    phoneInvalid: 'Use the format +964 7XX XXX XXXX',
    orgNameRequired: 'Enter the organisation name',
    orgTypeRequired: 'Choose the organisation type',
    governorateRequired: 'Choose a governorate',
    termsRequired: 'Confirm the details and accept the terms to continue',
    submitFailed: 'We could not create the workspace. Try again.',
    doneTitle: 'Workspace created',
    doneDescription: 'We sent a confirmation to {email}. You can sign in now.',
    startOver: 'Start over',
  },
  ar: {
    title: 'أنشئ مساحة العمل',
    subtitle: 'أربع خطوات قصيرة. تُحفظ إجاباتك أثناء تنقلك بينها.',
    stepsLabel: 'خطوات الإعداد',
    accountStep: 'الحساب',
    accountDescription: 'من يجري هذا الإعداد؟',
    organisationStep: 'الجهة',
    organisationDescription: 'عرّفنا بجهتك.',
    planStep: 'الباقة',
    planDescription: 'اختر باقة وإعداداتك الافتراضية.',
    reviewStep: 'المراجعة',
    reviewDescription: 'راجع كل شيء قبل الإرسال.',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني الوظيفي',
    phone: 'رقم الهاتف المحمول',
    phoneHint: 'الصيغة: +964 7XX XXX XXXX',
    orgName: 'اسم الجهة',
    orgType: 'نوع الجهة',
    orgTypePlaceholder: 'اختر النوع',
    governorate: 'المحافظة',
    governoratePlaceholder: 'اختر المحافظة',
    plan: 'الباقة',
    language: 'اللغة الافتراضية',
    newsletter: 'تحديثات المنتج',
    newsletterDescription: 'رسائل بريدية عن الميزات الجديدة بين حين وآخر.',
    terms: 'أؤكد صحة البيانات أعلاه وأوافق على شروط الخدمة',
    yes: 'نعم',
    no: 'لا',
    edit: 'تعديل',
    back: 'السابق',
    next: 'التالي',
    submit: 'إنشاء مساحة العمل',
    nameRequired: 'أدخل اسمك الكامل',
    emailRequired: 'أدخل بريدك الإلكتروني الوظيفي',
    emailInvalid: 'أدخل بريداً إلكترونياً صحيحاً',
    phoneInvalid: 'استخدم الصيغة +964 7XX XXX XXXX',
    orgNameRequired: 'أدخل اسم الجهة',
    orgTypeRequired: 'اختر نوع الجهة',
    governorateRequired: 'اختر المحافظة',
    termsRequired: 'أكّد البيانات ووافق على الشروط للمتابعة',
    submitFailed: 'تعذّر إنشاء مساحة العمل. حاول مرة أخرى.',
    doneTitle: 'تم إنشاء مساحة العمل',
    doneDescription: 'أرسلنا تأكيداً إلى {email}. يمكنك تسجيل الدخول الآن.',
    startOver: 'ابدأ من جديد',
  },
};

type Wizard01Labels = Record<keyof (typeof messages)['en'], string>;

interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

/** Sample choices: the value is stable, the label follows the UI language. */
const ORG_TYPES: Record<Locale, readonly ChoiceOption[]> = {
  en: [
    { value: 'public', label: 'Public body' },
    { value: 'private', label: 'Private company' },
    { value: 'ngo', label: 'Non-profit' },
  ],
  ar: [
    { value: 'public', label: 'جهة حكومية' },
    { value: 'private', label: 'شركة خاصة' },
    { value: 'ngo', label: 'منظمة غير ربحية' },
  ],
};

const PLANS: Record<Locale, readonly ChoiceOption[]> = {
  en: [
    { value: 'starter', label: 'Starter', description: 'Up to 10 people, one project.' },
    { value: 'team', label: 'Team', description: 'Up to 100 people, unlimited projects.' },
    { value: 'enterprise', label: 'Enterprise', description: 'Single sign-on and audit log.' },
  ],
  ar: [
    { value: 'starter', label: 'الأساسية', description: 'حتى ١٠ أشخاص ومشروع واحد.' },
    { value: 'team', label: 'الفريق', description: 'حتى ١٠٠ شخص ومشاريع غير محدودة.' },
    { value: 'enterprise', label: 'المؤسسات', description: 'تسجيل دخول موحّد وسجل تدقيق.' },
  ],
};

const LANGUAGES: Record<Locale, readonly ChoiceOption[]> = {
  en: [
    { value: 'ar', label: 'Arabic' },
    { value: 'en', label: 'English' },
  ],
  ar: [
    { value: 'ar', label: 'العربية' },
    { value: 'en', label: 'الإنجليزية' },
  ],
};

const GOVERNORATES: Record<Locale, readonly ComboboxOption[]> = {
  en: [
    { value: 'baghdad', label: 'Baghdad' },
    { value: 'basra', label: 'Basra' },
    { value: 'erbil', label: 'Erbil' },
    { value: 'najaf', label: 'Najaf' },
  ],
  ar: [
    { value: 'baghdad', label: 'بغداد' },
    { value: 'basra', label: 'البصرة' },
    { value: 'erbil', label: 'أربيل' },
    { value: 'najaf', label: 'النجف' },
  ],
};

function createSchema(labels: Wizard01Labels) {
  return z.object({
    fullName: z.string().trim().min(1, labels.nameRequired),
    email: z.string().min(1, labels.emailRequired).pipe(z.email(labels.emailInvalid)),
    phone: z.string().regex(/^\+964\s?7\d{2}\s?\d{3}\s?\d{4}$/, labels.phoneInvalid),
    orgName: z.string().trim().min(1, labels.orgNameRequired),
    orgType: z.string().min(1, labels.orgTypeRequired),
    governorate: z.string().min(1, labels.governorateRequired),
    plan: z.string(),
    language: z.string(),
    newsletter: z.boolean(),
    terms: z.boolean().refine((accepted) => accepted, labels.termsRequired),
  });
}

type Wizard01Values = z.infer<ReturnType<typeof createSchema>>;
type Wizard01Field = keyof Wizard01Values;

/** Fields each step owns: Next validates exactly these, the review step shows them all. */
const STEP_FIELDS: readonly (readonly Wizard01Field[])[] = [
  ['fullName', 'email', 'phone'],
  ['orgName', 'orgType', 'governorate'],
  ['plan', 'language', 'newsletter'],
  ['terms'],
];

const FIELD_NAMES: readonly Wizard01Field[] = STEP_FIELDS.flat();

const EMPTY_VALUES: Wizard01Values = {
  fullName: '',
  email: '',
  phone: '+964 ',
  orgName: '',
  orgType: '',
  governorate: '',
  plan: 'starter',
  language: 'ar',
  newsletter: true,
  terms: false,
};

/** Index of the first step that owns one of `fields`, or -1. */
function firstStepWith(fields: readonly string[]): number {
  return STEP_FIELDS.findIndex((owned) => owned.some((name) => fields.includes(name)));
}

/** The label for a stored option value; an unknown value is shown as it is. */
function labelOf(options: readonly ChoiceOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

/** Backend rejections are plain data: a validation payload (object or string) or an `Error`. */
function serverPayload(thrown: unknown): unknown {
  return thrown instanceof Error ? thrown.message : thrown;
}

export {
  EMPTY_VALUES,
  FIELD_NAMES,
  GOVERNORATES,
  LANGUAGES,
  ORG_TYPES,
  PLANS,
  STEP_FIELDS,
  createSchema,
  firstStepWith,
  labelOf,
  messages,
  serverPayload,
};
export type { ChoiceOption, Wizard01Field, Wizard01Labels, Wizard01Values };

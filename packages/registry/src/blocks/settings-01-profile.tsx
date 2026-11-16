import { useState } from 'react';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, useZodForm } from '@/components/ui/form';
import { TextareaField, TextField } from '@/components/ui/form-fields';
import { applyServerErrors } from '@/lib/form-errors';
import { useLabels, useLocale, type Locale, type Messages } from '@/lib/locale';

const messages: Messages<
  | 'title'
  | 'description'
  | 'displayName'
  | 'email'
  | 'phone'
  | 'phoneHint'
  | 'jobTitle'
  | 'bio'
  | 'save'
  | 'reset'
  | 'saved'
  | 'failed'
  | 'nameRequired'
  | 'emailRequired'
  | 'emailInvalid'
  | 'phoneInvalid'
  | 'bioTooLong'
> = {
  en: {
    title: 'Profile',
    description: 'How you appear to your teammates.',
    displayName: 'Display name',
    email: 'Email',
    phone: 'Mobile phone',
    phoneHint: 'Optional. Format: +964 7XX XXX XXXX',
    jobTitle: 'Job title',
    bio: 'About you',
    save: 'Save changes',
    reset: 'Reset',
    saved: 'Profile saved.',
    failed: 'We could not save your profile. Try again.',
    nameRequired: 'Enter your name',
    emailRequired: 'Enter your email',
    emailInvalid: 'Enter a valid email address',
    phoneInvalid: 'Use the format +964 7XX XXX XXXX',
    bioTooLong: 'Keep it under 200 characters',
  },
  ar: {
    title: 'الملف الشخصي',
    description: 'كيف تظهر لزملائك في الفريق.',
    displayName: 'الاسم المعروض',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف المحمول',
    phoneHint: 'اختياري. الصيغة: +964 7XX XXX XXXX',
    jobTitle: 'المسمى الوظيفي',
    bio: 'نبذة عنك',
    save: 'حفظ التغييرات',
    reset: 'استعادة',
    saved: 'تم حفظ الملف الشخصي.',
    failed: 'تعذّر حفظ ملفك الشخصي. حاول مرة أخرى.',
    nameRequired: 'أدخل اسمك',
    emailRequired: 'أدخل بريدك الإلكتروني',
    emailInvalid: 'أدخل بريداً إلكترونياً صحيحاً',
    phoneInvalid: 'استخدم الصيغة +964 7XX XXX XXXX',
    bioTooLong: 'اجعلها أقل من ٢٠٠ حرف',
  },
};

type Settings01ProfileLabels = Partial<Record<keyof (typeof messages)['en'], string>>;

interface Settings01ProfileValues {
  displayName: string;
  email: string;
  phone: string;
  jobTitle: string;
  bio: string;
}

/** Sample profile shown until the app passes the real one. */
const SAMPLE_PROFILE: Record<Locale, Settings01ProfileValues> = {
  en: {
    displayName: 'Layla Hassan',
    email: 'layla@example.com',
    phone: '+964 770 123 4567',
    jobTitle: 'Operations lead',
    bio: 'Runs the Baghdad office and the monthly planning.',
  },
  ar: {
    displayName: 'ليلى حسن',
    email: 'layla@example.com',
    phone: '+964 770 123 4567',
    jobTitle: 'مسؤولة العمليات',
    bio: 'تدير مكتب بغداد والتخطيط الشهري.',
  },
};

const FIELD_NAMES = ['displayName', 'email', 'phone', 'jobTitle', 'bio'] as const;

interface Settings01ProfileProps {
  /** The saved profile. Defaults to a sample in the UI language. */
  defaultValues?: Settings01ProfileValues;
  /** Image for the avatar; the initials show without it. */
  avatarSrc?: string;
  /**
   * Save the valid values. Reject with the backend's validation response
   * (an object, a string or an `Error`) to show it on the fields or the form.
   */
  onSave?: (values: Settings01ProfileValues) => void | Promise<void>;
  labels?: Settings01ProfileLabels;
}

/** Avatar and the editable profile fields; Save is enabled only while something changed. */
function Settings01Profile({
  defaultValues,
  avatarSrc,
  onSave,
  labels: overrides,
}: Settings01ProfileProps) {
  const labels = useLabels(messages, overrides);
  const { locale } = useLocale();
  const schema = z.object({
    displayName: z.string().trim().min(1, labels.nameRequired),
    email: z.string().min(1, labels.emailRequired).pipe(z.email(labels.emailInvalid)),
    phone: z
      .string()
      .refine((phone) => phone === '' || /^\+964\s?7\d{2}\s?\d{3}\s?\d{4}$/.test(phone), {
        message: labels.phoneInvalid,
      }),
    jobTitle: z.string(),
    bio: z.string().max(200, labels.bioTooLong),
  });
  const saved = defaultValues ?? SAMPLE_PROFILE[locale];
  const form = useZodForm(schema, { defaultValues: saved });
  const { isDirty, isSubmitting } = form.formState;
  const [status, setStatus] = useState<'saved' | null>(null);
  const name = form.watch('displayName');

  async function submit(values: Settings01ProfileValues) {
    setStatus(null);
    try {
      await onSave?.(values);
      form.reset(values);
      setStatus('saved');
    } catch (thrown) {
      applyServerErrors(form.setError, thrown instanceof Error ? thrown.message : thrown, {
        fieldNames: FIELD_NAMES,
        fallbackMessage: labels.failed,
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">{labels.title}</CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent className="gap-card flex flex-col">
        <div className="gap-row flex items-center">
          <Avatar size="xl" name={name.trim() === '' ? undefined : name} src={avatarSrc} />
          <div className="min-w-0">
            <p className="text-h4 text-text-primary truncate">{name}</p>
            <p className="text-b2 text-text-secondary truncate" dir="ltr">
              {form.watch('email')}
            </p>
          </div>
        </div>
        {status === 'saved' ? (
          <Alert variant="success" description={labels.saved} onDismiss={() => setStatus(null)} />
        ) : null}
        <Form form={form} onSubmit={submit}>
          <div className="gap-row grid sm:grid-cols-2">
            <TextField
              control={form.control}
              name="displayName"
              label={labels.displayName}
              autoComplete="name"
              required
            />
            <TextField
              control={form.control}
              name="jobTitle"
              label={labels.jobTitle}
              autoComplete="organization-title"
            />
            <TextField
              control={form.control}
              name="email"
              label={labels.email}
              type="email"
              autoComplete="email"
              required
            />
            <TextField
              control={form.control}
              name="phone"
              label={labels.phone}
              description={labels.phoneHint}
              type="tel"
              kind="latin"
              autoComplete="tel"
            />
          </div>
          <TextareaField control={form.control} name="bio" label={labels.bio} rows={3} />
          <div className="gap-field flex flex-col-reverse sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={!isDirty || isSubmitting}
              onClick={() => form.reset(saved)}
            >
              {labels.reset}
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              {labels.save}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}

export { SAMPLE_PROFILE, Settings01Profile };
export type { Settings01ProfileLabels, Settings01ProfileProps, Settings01ProfileValues };

import { useState } from 'react';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, useZodForm } from '@/components/ui/form';
import { SwitchField } from '@/components/ui/form-fields';
import { Separator } from '@/components/ui/separator';
import { useLabels, type Messages } from '@/lib/locale';

const messages: Messages<
  | 'title'
  | 'description'
  | 'security'
  | 'securityDescription'
  | 'mentions'
  | 'mentionsDescription'
  | 'product'
  | 'productDescription'
  | 'digest'
  | 'digestDescription'
  | 'save'
  | 'saved'
  | 'failed'
> = {
  en: {
    title: 'Notifications',
    description: 'Choose what we email you about.',
    security: 'Security alerts',
    securityDescription: 'New sign-ins and password changes. Recommended.',
    mentions: 'Mentions and replies',
    mentionsDescription: 'When someone mentions you or answers your comment.',
    product: 'Product updates',
    productDescription: 'New features and improvements, a few times a year.',
    digest: 'Weekly summary',
    digestDescription: 'A Sunday email with what happened in your projects.',
    save: 'Save preferences',
    saved: 'Notification preferences saved.',
    failed: 'We could not save your preferences. Try again.',
  },
  ar: {
    title: 'الإشعارات',
    description: 'اختر ما نراسلك بشأنه عبر البريد.',
    security: 'تنبيهات الأمان',
    securityDescription: 'عمليات تسجيل الدخول الجديدة وتغيير كلمة المرور. موصى به.',
    mentions: 'الإشارات والردود',
    mentionsDescription: 'عندما يشير إليك أحد أو يردّ على تعليقك.',
    product: 'تحديثات المنتج',
    productDescription: 'الميزات والتحسينات الجديدة، عدة مرات في السنة.',
    digest: 'الملخص الأسبوعي',
    digestDescription: 'رسالة كل أحد بما جرى في مشاريعك.',
    save: 'حفظ التفضيلات',
    saved: 'تم حفظ تفضيلات الإشعارات.',
    failed: 'تعذّر حفظ تفضيلاتك. حاول مرة أخرى.',
  },
};

type Settings01NotificationsLabels = Partial<Record<keyof (typeof messages)['en'], string>>;

const schema = z.object({
  security: z.boolean(),
  mentions: z.boolean(),
  product: z.boolean(),
  digest: z.boolean(),
});

type Settings01NotificationValues = z.infer<typeof schema>;

const DEFAULT_NOTIFICATIONS: Settings01NotificationValues = {
  security: true,
  mentions: true,
  product: false,
  digest: true,
};

const ROWS = ['security', 'mentions', 'product', 'digest'] as const;

interface Settings01NotificationsProps {
  /** The saved choices. Defaults to security, mentions and the weekly summary on. */
  defaultValues?: Settings01NotificationValues;
  /** Save the choices. Reject to show a failure notice and keep the switches as they are. */
  onSave?: (values: Settings01NotificationValues) => void | Promise<void>;
  labels?: Settings01NotificationsLabels;
}

/** Switch rows with a description each, saved together; Save is enabled once something changed. */
function Settings01Notifications({
  defaultValues = DEFAULT_NOTIFICATIONS,
  onSave,
  labels: overrides,
}: Settings01NotificationsProps) {
  const labels = useLabels(messages, overrides);
  const form = useZodForm(schema, { defaultValues });
  const { isDirty, isSubmitting } = form.formState;
  const [status, setStatus] = useState<'saved' | 'failed' | null>(null);

  async function submit(values: Settings01NotificationValues) {
    setStatus(null);
    try {
      await onSave?.(values);
      form.reset(values);
      setStatus('saved');
    } catch {
      setStatus('failed');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">{labels.title}</CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={submit}>
          {status ? (
            <Alert
              variant={status === 'saved' ? 'success' : 'danger'}
              description={status === 'saved' ? labels.saved : labels.failed}
              onDismiss={() => setStatus(null)}
            />
          ) : null}
          <div className="flex flex-col">
            {ROWS.map((row, index) => (
              <div key={row}>
                {index > 0 ? <Separator decorative className="my-field" /> : null}
                <SwitchField
                  control={form.control}
                  name={row}
                  label={labels[row]}
                  description={labels[`${row}Description`]}
                />
              </div>
            ))}
          </div>
          <div className="flex sm:justify-end">
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={!isDirty}
              className="max-sm:w-full"
            >
              {labels.save}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}

export { DEFAULT_NOTIFICATIONS, Settings01Notifications };
export type {
  Settings01NotificationsLabels,
  Settings01NotificationsProps,
  Settings01NotificationValues,
};

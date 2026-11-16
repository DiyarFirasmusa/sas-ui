import { useMemo } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, useZodForm } from '@/components/ui/form';
import { TextField } from '@/components/ui/form-fields';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<
  | 'title'
  | 'description'
  | 'email'
  | 'password'
  | 'remember'
  | 'forgot'
  | 'submit'
  | 'emailRequired'
  | 'emailInvalid'
  | 'passwordRequired'
  | 'noAccount'
  | 'signUp'
> = {
  en: {
    title: 'Sign in',
    description: 'Enter your email and password to continue.',
    email: 'Email',
    password: 'Password',
    remember: 'Remember me',
    forgot: 'Forgot password?',
    submit: 'Sign in',
    emailRequired: 'Enter your email',
    emailInvalid: 'Enter a valid email address',
    passwordRequired: 'Enter your password',
    noAccount: 'No account yet?',
    signUp: 'Request access',
  },
  ar: {
    title: 'تسجيل الدخول',
    description: 'أدخل بريدك الإلكتروني وكلمة المرور للمتابعة.',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    remember: 'تذكّرني',
    forgot: 'نسيت كلمة المرور؟',
    submit: 'تسجيل الدخول',
    emailRequired: 'أدخل بريدك الإلكتروني',
    emailInvalid: 'أدخل بريداً إلكترونياً صحيحاً',
    passwordRequired: 'أدخل كلمة المرور',
    noAccount: 'ليس لديك حساب؟',
    signUp: 'اطلب صلاحية الدخول',
  },
};

interface Login01Values {
  email: string;
  password: string;
  remember: boolean;
}

interface Login01Props extends Omit<React.ComponentProps<'div'>, 'onSubmit'> {
  /** Called with valid credentials. Reject (or throw) to keep the form and show `error`. */
  onSubmit?: (values: Login01Values) => void | Promise<void>;
  /** Server error shown above the fields (wrong credentials, locked account…). */
  error?: string;
  /** Product name shown above the card. */
  brand?: React.ReactNode;
  forgotPasswordHref?: string;
  signUpHref?: string;
  labels?: Partial<Record<keyof (typeof messages)['en'], string>>;
}

/**
 * Centred sign-in card: validated email and password, remember-me, a
 * single-flight submit, and a form-level server error. Direction follows the
 * UI language; email stays left-to-right while empty text follows the locale.
 */
function Login01({
  onSubmit,
  error,
  brand,
  forgotPasswordHref = '#',
  signUpHref = '#',
  labels: overrides,
  className,
  ...props
}: Login01Props) {
  const labels = useLabels(messages, overrides);
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().min(1, labels.emailRequired).pipe(z.email(labels.emailInvalid)),
        password: z.string().min(1, labels.passwordRequired),
        remember: z.boolean(),
      }),
    [labels.emailInvalid, labels.emailRequired, labels.passwordRequired],
  );
  const form = useZodForm(schema, {
    defaultValues: { email: '', password: '', remember: false },
  });
  const { isSubmitting } = form.formState;

  return (
    <div
      className={cn('grid min-h-svh place-items-center bg-background p-row', className)}
      {...props}
    >
      <div className="gap-row flex w-full max-w-sm flex-col">
        {brand ? <div className="text-h3 text-text-primary text-center">{brand}</div> : null}
        <Card>
          <CardHeader>
            <CardTitle>{labels.title}</CardTitle>
            <CardDescription>{labels.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form form={form} error={error} onSubmit={async (values) => onSubmit?.(values)}>
              <TextField
                control={form.control}
                name="email"
                label={labels.email}
                type="email"
                autoComplete="username"
                required
              />
              <TextField
                control={form.control}
                name="password"
                label={labels.password}
                type="password"
                kind="latin"
                autoComplete="current-password"
                required
              />
              <div className="gap-field flex items-center justify-between">
                <label className="gap-field text-b2 text-text-primary flex items-center">
                  <Checkbox
                    checked={form.watch('remember')}
                    onCheckedChange={(next) => form.setValue('remember', next)}
                  />
                  {labels.remember}
                </label>
                <a
                  href={forgotPasswordHref}
                  className="text-b2 text-primary-text underline-offset-4 hover:underline"
                >
                  {labels.forgot}
                </a>
              </div>
              <Button type="submit" loading={isSubmitting} className="w-full">
                {labels.submit}
              </Button>
            </Form>
          </CardContent>
        </Card>
        <p className="text-b2 text-text-secondary text-center">
          {labels.noAccount}{' '}
          <a href={signUpHref} className="text-primary-text underline-offset-4 hover:underline">
            {labels.signUp}
          </a>
        </p>
      </div>
    </div>
  );
}

export { Login01 };
export type { Login01Props, Login01Values };

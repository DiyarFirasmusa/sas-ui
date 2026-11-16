import { useMemo, type ReactNode } from 'react';
import { z } from 'zod';
import type { Login01Values } from '@/components/blocks/login-01';
import { Button } from '@/components/ui/button';
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
  | 'tagline'
  | 'footnote'
> = {
  en: {
    title: 'Welcome back',
    description: 'Sign in with your work email to continue.',
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
    tagline: 'Everything your team needs, in one place.',
    footnote: 'Secure sign-in for authorised staff only.',
  },
  ar: {
    title: 'أهلاً بعودتك',
    description: 'سجّل الدخول ببريدك الإلكتروني الوظيفي للمتابعة.',
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
    tagline: 'كل ما يحتاجه فريقك في مكان واحد.',
    footnote: 'تسجيل دخول آمن للموظفين المصرّح لهم فقط.',
  },
};

interface Login02Props extends Omit<React.ComponentProps<'div'>, 'onSubmit'> {
  /** Called with valid credentials. Reject (or throw) to keep the form and show `error`. */
  onSubmit?: (values: Login01Values) => void | Promise<void>;
  /** Server error shown above the fields (wrong credentials, locked account…). */
  error?: string;
  /** Product name beside the logo tile. */
  brand?: string;
  /** Glyph inside the logo tile; defaults to the brand's first letter. */
  logo?: ReactNode;
  /** Headline on the brand panel. Defaults to a localised tagline. */
  tagline?: ReactNode;
  /**
   * Top corner of the form column, for a language or theme switch
   * (`<ThemeSwitcher />`, a locale button…). Leave empty when the app has none.
   */
  switcher?: ReactNode;
  forgotPasswordHref?: string;
  signUpHref?: string;
  labels?: Partial<Record<keyof (typeof messages)['en'], string>>;
}

/** First visible character of the brand, for the logo tile (grapheme-safe). */
function brandInitial(brand: string): string {
  const segments = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(brand.trim());
  const first = segments[Symbol.iterator]().next();
  return first.done ? '' : first.value.segment.toLocaleUpperCase();
}

/**
 * Two-column sign-in. From `lg` up the brand panel (the preset's
 * `--auth-panel-from/to` gradient and `--brand-tile`) sits at the start edge
 * and mirrors in Arabic; below `lg` only the form shows. Same validation,
 * single-flight submit and server error as `Login01`.
 */
function Login02({
  onSubmit,
  error,
  brand = 'SAS Suite',
  logo,
  tagline,
  switcher,
  forgotPasswordHref = '#',
  signUpHref = '#',
  labels: overrides,
  className,
  ...props
}: Login02Props) {
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
      className={cn(
        'grid min-h-svh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]',
        className,
      )}
      {...props}
    >
      <aside
        data-slot="login-brand-panel"
        className="from-auth-panel-from to-auth-panel-to p-page hidden flex-col justify-between bg-linear-to-br text-white lg:flex"
      >
        <div className="gap-inline flex items-center">
          <span
            aria-hidden="true"
            className="bg-brand-tile text-brand-tile-foreground text-h3 grid size-11 place-items-center rounded-xl"
          >
            {logo ?? brandInitial(brand)}
          </span>
          <span className="text-h3">{brand}</span>
        </div>
        <p className="text-h1 max-w-md">{tagline ?? labels.tagline}</p>
        <p className="text-b2 text-white/70">{labels.footnote}</p>
      </aside>

      <main className="gap-page p-row sm:p-page flex flex-col">
        <div className="gap-field flex items-center justify-between">
          <span className="text-h4 text-text-primary lg:invisible">{brand}</span>
          {switcher ? <div data-slot="login-switcher">{switcher}</div> : null}
        </div>
        <div className="grid flex-1 place-items-center">
          <div className="gap-card flex w-full max-w-sm flex-col">
            <div className="gap-field flex flex-col">
              <h1 className="text-h2 text-text-primary">{labels.title}</h1>
              <p className="text-b2 text-text-secondary">{labels.description}</p>
            </div>
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
            <p className="text-b2 text-text-secondary text-center">
              {labels.noAccount}{' '}
              <a href={signUpHref} className="text-primary-text underline-offset-4 hover:underline">
                {labels.signUp}
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export { Login02 };
export type { Login02Props };

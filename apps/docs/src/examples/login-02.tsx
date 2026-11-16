import { useState } from 'react';
import { AuthSwitchers } from '@/components/blocks/auth-switchers';
import { Login02 } from '@/components/blocks/login-02';
import type { Locale } from '@/lib/locale';
import type { ColorMode } from '@/lib/theme';
import type { Example } from '../example-types';

function WithSwitchers() {
  const [locale, setLocale] = useState<Locale>('en');
  const [mode, setMode] = useState<ColorMode>('light');
  return (
    <Login02
      brand="SAS Suite"
      switcher={
        <AuthSwitchers
          locale={locale}
          onLocaleChange={setLocale}
          mode={mode}
          onModeChange={setMode}
        />
      }
    />
  );
}

export const examples: Example[] = [
  {
    fullBleed: true,
    title: 'Split sign-in',
    wide: true,
    render: () => <Login02 brand="SAS Suite" />,
  },
  {
    fullBleed: true,
    title: 'With language and theme pills',
    description:
      'The language and theme switches of the dashboards in the corner of the form side, through the `switcher` slot.',
    wide: true,
    render: () => <WithSwitchers />,
  },
  {
    title: 'With a server error',
    wide: true,
    render: () => <Login02 brand="SAS Suite" error="Wrong email or password" />,
  },
];

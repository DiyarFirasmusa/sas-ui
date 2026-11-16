import { Login02 } from '@/components/blocks/login-02';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    fullBleed: true,
    title: 'Split sign-in',
    wide: true,
    render: () => <Login02 brand="SAS Suite" />,
  },
  {
    title: 'With a server error',
    wide: true,
    render: () => <Login02 brand="SAS Suite" error="Wrong email or password" />,
  },
];

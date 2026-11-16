import { Login01 } from '@/components/blocks/login-01';
import type { Example } from '../example-types';

export const examples: Example[] = [
  { fullBleed: true, title: 'Sign in', wide: true, render: () => <Login01 brand="SAS Suite" /> },
];

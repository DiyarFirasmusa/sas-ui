import { Spinner } from '@/components/ui/spinner';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Sizes',
    description:
      'Announced as a status in the active language; stops spinning with prefers-reduced-motion.',
    render: () => (
      <>
        <Spinner />
        <Spinner className="[&>svg]:size-6" />
        <Spinner className="text-primary-text [&>svg]:size-8" />
      </>
    ),
  },
];

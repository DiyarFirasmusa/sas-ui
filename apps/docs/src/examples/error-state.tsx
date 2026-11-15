import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import type { Example } from '../example-types';

function Retrying() {
  const [retrying, setRetrying] = useState(false);
  return (
    <ErrorState
      details="HTTP 503 Service Unavailable"
      retrying={retrying}
      onRetry={() => {
        setRetrying(true);
        setTimeout(() => setRetrying(false), 1500);
      }}
    />
  );
}

export const examples: Example[] = [
  {
    title: 'With retry',
    description: 'The retry button spins and ignores clicks while retrying.',
    render: () => <Retrying />,
  },
  {
    title: 'Not found (page)',
    render: () => (
      <ErrorState
        kind="not-found"
        size="page"
        actions={<Button variant="outline">Go home</Button>}
      />
    ),
  },
  {
    title: 'Forbidden',
    render: () => <ErrorState kind="forbidden" />,
  },
  {
    title: 'Localised defaults',
    description: 'Switch the docs locale to Arabic to see the built-in wording.',
    render: () => <ErrorState onRetry={() => {}} />,
  },
];

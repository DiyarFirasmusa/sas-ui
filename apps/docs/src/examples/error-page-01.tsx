import { ErrorPage01 } from '@/components/blocks/error-page-01';
import type { Example } from '../example-types';

export const examples: Example[] = [
  { fullBleed: true, title: '404 not found', wide: true, render: () => <ErrorPage01 kind="404" /> },
  { title: '403 forbidden', wide: true, render: () => <ErrorPage01 kind="403" /> },
  {
    title: '500 server error',
    wide: true,
    render: () => (
      <ErrorPage01 kind="500" reference="req_8f2a91c4" supportHref="#support" onRetry={() => {}} />
    ),
  },
  {
    title: 'Offline',
    wide: true,
    render: () => <ErrorPage01 kind="offline" onRetry={() => {}} />,
  },
  {
    title: 'Maintenance',
    wide: true,
    render: () => <ErrorPage01 kind="maintenance" supportHref="#support" onRetry={() => {}} />,
  },
];

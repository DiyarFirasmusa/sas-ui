import { DetailPage01 } from '@/components/blocks/detail-page-01';
import { sampleApplication } from '@/components/blocks/detail-page-01-data';
import type { Example } from '../example-types';

const noop = () => {};

export const examples: Example[] = [
  {
    title: 'Application',
    description:
      'Overview, documents and activity tabs. Actions appear when their handlers are passed.',
    wide: true,
    render: () => (
      <DetailPage01
        onEdit={noop}
        onDelete={async () => {}}
        onDownloadDocument={noop}
        onRemoveDocument={noop}
        onUpload={async () => {}}
      />
    ),
  },
  {
    title: 'Rejected',
    wide: true,
    render: () => (
      <DetailPage01
        state={{ status: 'success', data: { ...sampleApplication, status: 'rejected' } }}
        onEdit={noop}
      />
    ),
  },
  { title: 'Loading', wide: true, render: () => <DetailPage01 state={{ status: 'loading' }} /> },
  {
    title: 'Error',
    wide: true,
    render: () => <DetailPage01 state={{ status: 'error' }} onRetry={noop} />,
  },
];

import { AttachmentCard } from '@/components/ui/attachment-card';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Actions and metadata',
    wide: true,
    render: () => (
      <div className="gap-field flex w-full max-w-md flex-col">
        <AttachmentCard
          name="license-renewal.pdf"
          size={2_411_724}
          meta="Uploaded today"
          onDownload={() => {}}
          onRemove={() => {}}
        />
        <AttachmentCard name="شهادة-التسجيل.pdf" size={184_320} onDownload={() => {}} />
        <AttachmentCard name="no-size.txt" />
      </div>
    ),
  },
];

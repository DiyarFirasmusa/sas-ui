import { AttachmentCard } from '@/components/ui/attachment-card';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Grid card with a preview',
    description:
      'Pass `preview` for the dashboards’ attachment card: a 4:3 preview, a type tag and hover actions. `selectable` makes the preview a toggle.',
    wide: true,
    render: () => (
      <div className="gap-row grid w-full max-w-xl grid-cols-2">
        {(['National ID', 'Passport'] as const).map((type, index) => (
          <AttachmentCard
            key={type}
            name={type}
            typeLabel={type}
            typeTone={index === 0 ? 'cyan' : 'purple'}
            meta="Uploaded 3 minutes ago"
            selectable
            selected={index === 0}
            preview={<div className="bg-primary-light size-full" />}
            onView={() => {}}
            onRemove={() => {}}
          />
        ))}
      </div>
    ),
  },
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

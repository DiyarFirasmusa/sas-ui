import { Button } from '@/components/ui/button';
import { FolderIcon, PlusIcon } from '@/components/ui/icons';
import { SectionTitle } from '@/components/ui/section-title';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'With icon, description and action',
    wide: true,
    render: () => (
      <SectionTitle
        className="w-full"
        icon={<FolderIcon />}
        title="Documents"
        description="Files attached to this request"
        action={
          <Button size="sm">
            <PlusIcon /> Add
          </Button>
        }
      />
    ),
  },
  { title: 'Plain', render: () => <SectionTitle title="Summary" level={3} /> },
];

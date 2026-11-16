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
  {
    title: 'Accent bar',
    description:
      'Without an icon the title gets the dashboards’ 4px accent bar; `gold` swaps its colour.',
    render: () => (
      <div className="gap-row flex flex-col">
        <SectionTitle title="Summary" />
        <SectionTitle title="Highlights" accent="gold" />
      </div>
    ),
  },
];

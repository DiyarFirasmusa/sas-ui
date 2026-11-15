import { DetailField, DetailGrid } from '@/components/ui/detail-field';
import { UserIcon } from '@/components/ui/icons';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Detail grid',
    description: 'Empty values render an em dash so the grid keeps its shape.',
    wide: true,
    render: () => (
      <DetailGrid className="w-full">
        <DetailField label="Applicant" value="Layla Hassan" icon={<UserIcon />} />
        <DetailField label="Reference" value={<span dir="ltr">TB-2026-0142</span>} />
        <DetailField label="Phone" />
        <DetailField label="Notes" tone="boxed" value="Boxed values give a result more weight." />
      </DetailGrid>
    ),
  },
];

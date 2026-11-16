import { Wizard01 } from '@/components/blocks/wizard-01';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Create a workspace',
    description: 'Next validates the current step only; the last step reviews every answer.',
    wide: true,
    render: () => (
      <Wizard01 onSubmit={() => new Promise<void>((resolve) => setTimeout(resolve, 800))} />
    ),
  },
];

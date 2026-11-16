import { FormPage01 } from '@/components/blocks/form-page-01';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Create',
    description:
      'Submit with taken@example.com to see the server error land on the email field; edit anything and press Cancel to see the discard guard.',
    wide: true,
    render: () => <FormPage01 />,
  },
  {
    title: 'Edit an existing record',
    wide: true,
    render: () => (
      <FormPage01
        defaultValues={{
          fullName: 'Layla Hassan',
          nationalId: '123456789012',
          email: 'layla@example.com',
          phone: '+964 770 123 4567',
          governorate: 'baghdad',
          addressLine: 'Karrada, street 52',
          birthDate: '1992-04-12',
          startDate: '2025-01-01',
          notes: 'Transferred from the Basra office.',
        }}
      />
    ),
  },
];

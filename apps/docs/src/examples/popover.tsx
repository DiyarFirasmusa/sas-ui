import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Basic',
    render: () => (
      <Popover>
        <PopoverTrigger render={<Button variant="outline" />}>Details</PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>Application TB-2026-0142</PopoverTitle>
          <PopoverDescription>
            Submitted yesterday, waiting for the licensing officer.
          </PopoverDescription>
        </PopoverContent>
      </Popover>
    ),
  },
];

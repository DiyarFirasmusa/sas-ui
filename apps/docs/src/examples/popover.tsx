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
  {
    title: 'Positioning',
    description:
      'positionMethod, collisionPadding, collisionAvoidance, sticky and alignOffset pass to Base UI; positionerClassName styles the wrapper (here: as wide as the trigger).',
    render: () => (
      <Popover>
        <PopoverTrigger render={<Button variant="outline" className="w-56" />}>
          Anchored panel
        </PopoverTrigger>
        <PopoverContent
          align="start"
          alignOffset={0}
          positionMethod="fixed"
          collisionPadding={12}
          sticky
          positionerClassName="w-56"
          className="w-full"
        >
          <PopoverTitle>As wide as the trigger</PopoverTitle>
          <PopoverDescription>Fixed positioning, kept 12px inside the viewport.</PopoverDescription>
        </PopoverContent>
      </Popover>
    ),
  },
];

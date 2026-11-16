import { Button } from '@/components/ui/button';
import { PencilIcon, TrashIcon } from '@/components/ui/icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'Icon button',
    description:
      'The tooltip repeats the name, it does not replace it: the button keeps its own aria-label because touch and some screen-reader users never see a tooltip.',
    render: () => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="Edit" />}>
            <PencilIcon />
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
  },
  {
    title: 'With arrow and shared delay',
    description:
      'Inside one provider the second tooltip opens instantly after the first. showArrow is off by default; opt in per tooltip.',
    render: () => (
      <TooltipProvider delay={600}>
        <div className="gap-field flex">
          <Tooltip>
            <TooltipTrigger render={<Button variant="outline" size="icon" aria-label="Edit" />}>
              <PencilIcon />
            </TooltipTrigger>
            <TooltipContent showArrow>Edit item</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<Button variant="outline" size="icon" aria-label="Delete" />}>
              <TrashIcon />
            </TooltipTrigger>
            <TooltipContent showArrow>Delete item</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    ),
  },
  {
    title: 'Logical side',
    description: '`inline-end` is the right edge in English and the left edge in Arabic.',
    render: () => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>Hover or focus me</TooltipTrigger>
          <TooltipContent side="inline-end">Appears at the inline end</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
  },
];

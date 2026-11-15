import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  type SheetSide,
} from '@/components/ui/sheet';
import type { Example } from '../example-types';

function FilterSheet({ side, trigger }: { side: SheetSide; trigger: string }) {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>{trigger}</SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow the list of results.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <p className="text-b1 text-text-secondary">Filter controls go here.</p>
        </SheetBody>
        <SheetFooter>
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <SheetClose render={<Button />}>Apply</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export const examples: Example[] = [
  {
    title: 'End (default)',
    description: 'Opens on the right in English and on the left in Arabic.',
    render: () => <FilterSheet side="end" trigger="Open at end" />,
  },
  {
    title: 'Start',
    render: () => <FilterSheet side="start" trigger="Open at start" />,
  },
  {
    title: 'Top',
    render: () => <FilterSheet side="top" trigger="Open at top" />,
  },
  {
    title: 'Bottom',
    render: () => <FilterSheet side="bottom" trigger="Open at bottom" />,
  },
];

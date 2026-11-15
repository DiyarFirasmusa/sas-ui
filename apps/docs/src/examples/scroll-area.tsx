import { ScrollArea } from '@/components/ui/scroll-area';
import type { Example } from '../example-types';

const rows = Array.from({ length: 24 }, (_, index) => `Item ${index + 1}`);

export const examples: Example[] = [
  {
    title: 'Vertical',
    render: () => (
      <ScrollArea
        className="border-stroke h-56 w-64 rounded-lg border"
        viewportProps={{ 'aria-label': 'Items' }}
      >
        <ul className="gap-field p-row text-b1 flex flex-col">
          {rows.map((row) => (
            <li key={row}>{row}</li>
          ))}
        </ul>
      </ScrollArea>
    ),
  },
  {
    title: 'Horizontal',
    render: () => (
      <ScrollArea
        orientation="horizontal"
        className="border-stroke w-72 rounded-lg border"
        viewportProps={{ 'aria-label': 'Tags' }}
      >
        <ul className="gap-field p-row text-b1 flex w-max pb-5">
          {rows.slice(0, 12).map((row) => (
            <li
              key={row}
              className="rounded-pill bg-tag-neutral-container px-inline text-tag-neutral py-1"
            >
              {row}
            </li>
          ))}
        </ul>
      </ScrollArea>
    ),
  },
  {
    title: 'Arabic content (RTL)',
    render: () => (
      <ScrollArea
        dir="rtl"
        className="border-stroke h-40 w-64 rounded-lg border"
        viewportProps={{ 'aria-label': 'العناصر' }}
      >
        <ul className="gap-field p-row text-b1 flex flex-col">
          {rows.map((row, index) => (
            <li key={row}>عنصر {index + 1}</li>
          ))}
        </ul>
      </ScrollArea>
    ),
  },
];

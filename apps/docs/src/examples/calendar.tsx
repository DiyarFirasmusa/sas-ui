import { useState } from 'react';
import { Calendar, type DateRangeValue } from '@/components/ui/calendar';
import type { Example } from '../example-types';

function Single() {
  const [value, setValue] = useState<string | null>('2026-11-18');
  return (
    <div className="gap-field flex flex-col">
      <Calendar value={value} onValueChange={setValue} />
      <p className="text-b3 text-text-muted">Value: {value ?? 'none'}</p>
    </div>
  );
}

function Multiple() {
  const [value, setValue] = useState<string[]>(['2026-11-03', '2026-11-17']);
  return (
    <div className="gap-field flex flex-col">
      <Calendar mode="multiple" defaultMonth="2026-11-01" value={value} onValueChange={setValue} />
      <p className="text-b3 text-text-muted">{value.length} days selected</p>
    </div>
  );
}

function Range({ months }: { months: 1 | 2 }) {
  const [value, setValue] = useState<DateRangeValue>({
    from: '2026-11-10',
    to: '2026-11-14',
  });
  return (
    <div className="gap-field flex flex-col">
      <Calendar
        mode="range"
        numberOfMonths={months}
        defaultMonth="2026-11-01"
        value={value}
        onValueChange={setValue}
      />
      <p className="text-b3 text-text-muted">
        {value.from ?? '…'} to {value.to ?? '…'}
      </p>
    </div>
  );
}

export const examples: Example[] = [
  {
    title: 'Single date',
    description: 'Arrow keys, Home/End, PageUp/PageDown. Arrows mirror in RTL.',
    render: () => <Single />,
  },
  { title: 'Multiple dates', render: () => <Multiple /> },
  { title: 'Date range', render: () => <Range months={1} /> },
  { title: 'Two months', wide: true, render: () => <Range months={2} /> },
  {
    title: 'Min, max and unavailable days',
    description: 'Fridays are unavailable; only 10-25 November can be chosen.',
    render: () => (
      <Calendar
        defaultMonth="2026-11-01"
        min="2026-11-10"
        max="2026-11-25"
        isDateDisabled={(date) => date.getDay() === 5}
      />
    ),
  },
  {
    title: 'Week starts on Monday',
    render: () => <Calendar defaultMonth="2026-11-01" weekStartsOn={1} />,
  },
  {
    title: 'Locale digits',
    description: 'Latin digits by default; numerals="locale" uses Arabic-Indic digits in Arabic.',
    render: () => <Calendar defaultMonth="2026-11-01" numerals="locale" />,
  },
  {
    title: 'Read-only',
    render: () => <Calendar defaultMonth="2026-11-01" value="2026-11-18" readOnly />,
  },
  {
    title: 'Disabled',
    render: () => <Calendar defaultMonth="2026-11-01" value="2026-11-18" disabled />,
  },
];

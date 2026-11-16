import { useState } from 'react';
import { Calendar, type DateRangeValue } from '@/components/ui/calendar';
import { LocaleProvider } from '@/lib/locale';
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

function HijriSelection() {
  const [value, setValue] = useState<string | null>('2026-11-16');
  return (
    <div className="gap-field flex flex-col">
      <Calendar calendarSystem="islamic-umalqura" value={value} onValueChange={setValue} />
      <p className="text-b3 text-text-muted">Value stays Gregorian ISO: {value ?? 'none'}</p>
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
  {
    title: 'Hijri calendar',
    description:
      'calendarSystem="islamic-umalqura" (or "islamic-civil"). Only the display changes: the value, min/max and callbacks stay Gregorian ISO. PageUp/PageDown move by Hijri month.',
    render: () => <HijriSelection />,
  },
  {
    title: 'Hijri with Gregorian underneath',
    description: 'secondaryCalendar="gregory" prints the Gregorian day small under each Hijri day.',
    render: () => (
      <Calendar
        calendarSystem="islamic-umalqura"
        secondaryCalendar="gregory"
        defaultMonth="2026-11-16"
        defaultValue="2026-11-16"
      />
    ),
  },
  {
    title: 'Month and year dropdowns',
    description: 'captionLayout="dropdowns"; the years follow min/max, or +-100 years.',
    render: () => <Calendar captionLayout="dropdowns" defaultMonth="2026-11-01" />,
  },
  {
    title: 'Hijri range with dropdowns',
    wide: true,
    render: () => (
      <Calendar
        mode="range"
        numberOfMonths={2}
        calendarSystem="islamic-umalqura"
        secondaryCalendar="gregory"
        captionLayout="dropdowns"
        defaultMonth="2026-11-16"
        defaultValue={{ from: '2026-11-16', to: '2026-11-25' }}
      />
    ),
  },
  {
    title: 'Hijri in Arabic (RTL)',
    description:
      'Saturday first, Arabic month names, Latin digits (numerals="locale" for Arabic-Indic).',
    render: () => (
      <LocaleProvider locale="ar">
        <div dir="rtl">
          <Calendar
            calendarSystem="islamic-umalqura"
            secondaryCalendar="gregory"
            captionLayout="dropdowns"
            defaultMonth="2026-11-16"
            defaultValue="2026-11-16"
          />
        </div>
      </LocaleProvider>
    ),
  },
];

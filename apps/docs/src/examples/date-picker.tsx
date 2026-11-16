import { useState } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { Field } from '@/components/ui/field';
import { LocaleProvider } from '@/lib/locale';
import type { Example } from '../example-types';

function Controlled() {
  const [value, setValue] = useState<string | null>('2026-11-18');
  return (
    <Field label="Due date" description={`Value: ${value ?? 'none'}`} className="w-72">
      <DatePicker value={value} onValueChange={setValue} clearable />
    </Field>
  );
}

function Hijri() {
  const [value, setValue] = useState<string | null>('2026-11-16');
  return (
    <Field label="Due date" description={`Value: ${value ?? 'none'}`} className="w-72">
      <DatePicker
        calendarSystem="islamic-umalqura"
        value={value}
        onValueChange={setValue}
        clearable
      />
    </Field>
  );
}

export const examples: Example[] = [
  {
    title: 'Default',
    render: () => (
      <Field label="Start date" className="w-72">
        <DatePicker />
      </Field>
    ),
  },
  { title: 'Controlled and clearable', render: () => <Controlled /> },
  {
    title: 'Shorter display',
    render: () => (
      <Field label="Issued" className="w-72">
        <DatePicker defaultValue="2026-03-05" dateStyle="medium" />
      </Field>
    ),
  },
  {
    title: 'Limits and unavailable days',
    description: 'Only weekdays in the next weeks can be chosen.',
    render: () => (
      <Field label="Appointment" description="Weekends are unavailable" className="w-72">
        <DatePicker
          defaultMonth="2026-11-01"
          min="2026-11-10"
          max="2026-12-20"
          isDateDisabled={(date) => date.getDay() === 5 || date.getDay() === 6}
        />
      </Field>
    ),
  },
  {
    title: 'Arabic-Indic digits',
    render: () => (
      <Field label="Date" className="w-72">
        <DatePicker defaultValue="2026-11-18" numerals="locale" />
      </Field>
    ),
  },
  {
    title: 'Invalid',
    render: () => (
      <Field label="Birth date" error="Birth date is required" className="w-72">
        <DatePicker />
      </Field>
    ),
  },
  {
    title: 'Disabled and read-only',
    render: () => (
      <div className="gap-row flex w-72 flex-col">
        <Field label="Locked">
          <DatePicker disabled defaultValue="2026-11-18" />
        </Field>
        <Field label="Read-only">
          <DatePicker readOnly defaultValue="2026-11-18" />
        </Field>
      </div>
    ),
  },
  {
    title: 'Hijri',
    description:
      'The trigger reads in the chosen calendar; the value stays a Gregorian ISO string (see the description).',
    render: () => <Hijri />,
  },
  {
    title: 'Hijri with Gregorian underneath',
    render: () => (
      <Field label="Date" className="w-72">
        <DatePicker
          calendarSystem="islamic-umalqura"
          secondaryCalendar="gregory"
          defaultValue="2026-11-16"
        />
      </Field>
    ),
  },
  {
    title: 'Month and year dropdowns',
    description: 'Useful for far-away dates such as birth dates.',
    render: () => (
      <Field label="Birth date" className="w-72">
        <DatePicker
          captionLayout="dropdowns"
          defaultMonth="1990-01-01"
          min="1920-01-01"
          max="2026-11-16"
        />
      </Field>
    ),
  },
  {
    title: 'Hijri in Arabic (RTL)',
    render: () => (
      <LocaleProvider locale="ar">
        <div dir="rtl" className="w-72">
          <Field label="التاريخ">
            <DatePicker
              calendarSystem="islamic-umalqura"
              secondaryCalendar="gregory"
              captionLayout="dropdowns"
              defaultValue="2026-11-16"
              clearable
            />
          </Field>
        </div>
      </LocaleProvider>
    ),
  },
];

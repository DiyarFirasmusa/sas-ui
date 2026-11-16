import { useState } from 'react';
import type { DateRangeValue } from '@/components/ui/calendar';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Field } from '@/components/ui/field';
import { LocaleProvider } from '@/lib/locale';
import type { Example } from '../example-types';

function Controlled() {
  const [value, setValue] = useState<DateRangeValue>({
    from: '2026-11-10',
    to: '2026-11-14',
  });
  return (
    <Field
      label="Report period"
      description={`from ${value.from ?? '…'} to ${value.to ?? '…'}`}
      className="w-80"
    >
      <DateRangePicker value={value} onValueChange={setValue} clearable />
    </Field>
  );
}

export const examples: Example[] = [
  {
    title: 'Default (two months on wide screens)',
    render: () => (
      <Field label="Stay" className="w-80">
        <DateRangePicker />
      </Field>
    ),
  },
  { title: 'Controlled and clearable', render: () => <Controlled /> },
  {
    title: 'With presets',
    render: () => (
      <Field label="Period" className="w-80">
        <DateRangePicker
          defaultMonth="2026-11-01"
          presets={[
            {
              label: 'First week',
              value: { from: '2026-11-01', to: '2026-11-07' },
            },
            {
              label: 'Second week',
              value: { from: '2026-11-08', to: '2026-11-14' },
            },
            {
              label: 'All of November',
              value: { from: '2026-11-01', to: '2026-11-30' },
            },
          ]}
        />
      </Field>
    ),
  },
  {
    title: 'One month, with limits',
    render: () => (
      <Field label="Booking" className="w-80">
        <DateRangePicker
          numberOfMonths={1}
          defaultMonth="2026-11-01"
          min="2026-11-05"
          max="2026-12-15"
        />
      </Field>
    ),
  },
  {
    title: 'Invalid',
    render: () => (
      <Field label="Period" error="Choose a start and end date" className="w-80">
        <DateRangePicker />
      </Field>
    ),
  },
  {
    title: 'Disabled',
    render: () => (
      <Field label="Period" className="w-80">
        <DateRangePicker disabled defaultValue={{ from: '2026-11-10', to: '2026-11-14' }} />
      </Field>
    ),
  },
  {
    title: 'Hijri',
    description: 'Two Hijri months on wide screens; the committed range stays Gregorian ISO.',
    render: () => (
      <Field label="Period" className="w-96">
        <DateRangePicker
          calendarSystem="islamic-umalqura"
          defaultMonth="2026-11-16"
          defaultValue={{ from: '2026-11-16', to: '2026-11-25' }}
        />
      </Field>
    ),
  },
  {
    title: 'Hijri with Gregorian underneath',
    render: () => (
      <Field label="Period" className="w-96">
        <DateRangePicker
          calendarSystem="islamic-umalqura"
          secondaryCalendar="gregory"
          defaultMonth="2026-11-16"
        />
      </Field>
    ),
  },
  {
    title: 'Month and year dropdowns',
    render: () => (
      <Field label="Period" className="w-96">
        <DateRangePicker captionLayout="dropdowns" defaultMonth="2026-11-01" />
      </Field>
    ),
  },
  {
    title: 'Hijri in Arabic (RTL)',
    render: () => (
      <LocaleProvider locale="ar">
        <div dir="rtl" className="w-96">
          <Field label="الفترة">
            <DateRangePicker
              calendarSystem="islamic-umalqura"
              secondaryCalendar="gregory"
              captionLayout="dropdowns"
              defaultMonth="2026-11-16"
              defaultValue={{ from: '2026-11-16', to: '2026-11-25' }}
              clearable
            />
          </Field>
        </div>
      </LocaleProvider>
    ),
  },
];

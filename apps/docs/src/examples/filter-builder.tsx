import { useState } from 'react';
import { FilterBuilder } from '@/components/ui/filter-builder';
import { createGroup, type FilterField, type FilterGroup } from '@/lib/filter-builder';
import { evaluate, type FieldAccessors } from '@/lib/filter-builder-evaluate';
import { toSearchParams } from '@/lib/filter-builder-url';
import { LocaleProvider } from '@/lib/locale';
import type { Example } from '../example-types';

interface Invoice {
  customer: string;
  amount: number;
  issued: string;
  status: 'draft' | 'sent' | 'paid';
  overdue: boolean;
}

const invoices: Invoice[] = [
  { customer: 'أحمد الجبوري', amount: 1250, issued: '2026-10-02', status: 'paid', overdue: false },
  { customer: 'إبراهيم علي', amount: 480, issued: '2026-11-05', status: 'sent', overdue: true },
  { customer: 'Acme Trading', amount: 9800, issued: '2026-11-12', status: 'sent', overdue: false },
  { customer: 'مُحَمَّد حسن', amount: 75, issued: '2026-09-20', status: 'draft', overdue: false },
  { customer: 'Café Müller', amount: 2300, issued: '2026-11-14', status: 'paid', overdue: false },
];

const accessors: FieldAccessors<Invoice> = {
  customer: (row) => row.customer,
  amount: (row) => row.amount,
  issued: (row) => row.issued,
  status: (row) => row.status,
  overdue: (row) => row.overdue,
};

const englishFields: FilterField[] = [
  { id: 'customer', label: 'Customer', type: 'text' },
  { id: 'amount', label: 'Amount', type: 'number' },
  { id: 'issued', label: 'Issued', type: 'date' },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'sent', label: 'Sent' },
      { value: 'paid', label: 'Paid' },
    ],
  },
  { id: 'overdue', label: 'Overdue', type: 'boolean' },
];

const arabicFields: FilterField[] = [
  { id: 'customer', label: 'العميل', type: 'text' },
  { id: 'amount', label: 'المبلغ', type: 'number' },
  { id: 'issued', label: 'تاريخ الإصدار', type: 'date' },
  {
    id: 'status',
    label: 'الحالة',
    type: 'select',
    options: [
      { value: 'draft', label: 'مسودة' },
      { value: 'sent', label: 'مرسلة' },
      { value: 'paid', label: 'مدفوعة' },
    ],
  },
  { id: 'overdue', label: 'متأخرة', type: 'boolean' },
];

function Demo({
  fields,
  initial = createGroup(),
  maxDepth,
}: {
  fields: FilterField[];
  initial?: FilterGroup;
  maxDepth?: number;
}) {
  const [draft, setDraft] = useState(initial);
  const [applied, setApplied] = useState(initial);
  const shown = invoices.filter((row) => evaluate(applied, row, accessors));
  const query = toSearchParams(applied).toString();
  return (
    <div className="gap-row flex w-full max-w-4xl flex-col">
      <FilterBuilder
        fields={fields}
        value={draft}
        onChange={setDraft}
        onApply={setApplied}
        onReset={() => setApplied(createGroup())}
        maxDepth={maxDepth}
      />
      <div className="gap-field flex flex-col">
        <p className="text-b2 text-text-muted">
          {shown.length} of {invoices.length} invoices
        </p>
        <ul className="gap-field text-b1 flex flex-col">
          {shown.map((row) => (
            <li key={row.customer}>
              <bdi>{row.customer}</bdi> · <span dir="ltr">{row.amount}</span> ·{' '}
              <span dir="ltr">{row.issued}</span> · {row.status}
            </li>
          ))}
        </ul>
        <code dir="ltr" className="text-b3 text-text-muted break-all">
          {query === '' ? '(no filter in the URL)' : decodeURIComponent(query)}
        </code>
      </div>
    </div>
  );
}

const nested = createGroup('and', [
  { id: 'a', field: 'status', operator: 'is_any_of', value: ['sent', 'paid'] },
  createGroup('or', [
    { id: 'b', field: 'amount', operator: 'gte', value: 2000 },
    { id: 'c', field: 'overdue', operator: 'is_true', value: null },
  ]),
]);

const arabicSearch = createGroup('and', [
  { id: 'a', field: 'customer', operator: 'contains', value: 'احمد' },
]);

export const examples: Example[] = [
  {
    title: 'Start empty',
    description:
      'Add rules, then Apply. Incomplete rules are flagged instead of applied; Reset clears both.',
    wide: true,
    render: () => <Demo fields={englishFields} />,
  },
  {
    title: 'Nested groups',
    description:
      'Status is sent or paid, and either the amount is large or the invoice is overdue.',
    wide: true,
    render: () => <Demo fields={englishFields} initial={nested} />,
  },
  {
    title: 'One level only',
    wide: true,
    render: () => <Demo fields={englishFields} maxDepth={1} />,
  },
  {
    title: 'Arabic (right to left)',
    description:
      'The search "احمد" finds "أحمد": alef forms, diacritics and digit styles are ignored in text rules.',
    wide: true,
    render: () => (
      <LocaleProvider locale="ar">
        <Demo fields={arabicFields} initial={arabicSearch} />
      </LocaleProvider>
    ),
  },
];

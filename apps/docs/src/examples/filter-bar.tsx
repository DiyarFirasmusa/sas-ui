import { useState } from 'react';
import { FilterBar } from '@/components/ui/filter-bar';
import {
  parseFilters,
  serializeFilters,
  type FilterDefinition,
  type FilterValues,
} from '@/lib/filter-state';
import type { Example } from '../example-types';

const filters: FilterDefinition[] = [
  { key: 'reference', type: 'text', label: 'Reference', group: 'General' },
  {
    key: 'status',
    type: 'select',
    label: 'Status',
    group: 'General',
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'sent', label: 'Sent' },
      { value: 'paid', label: 'Paid' },
    ],
  },
  {
    key: 'channel',
    type: 'multi-select',
    label: 'Channel',
    group: 'General',
    options: [
      { value: 'web', label: 'Web' },
      { value: 'agent', label: 'Agent' },
      { value: 'partner', label: 'الشركاء' },
    ],
  },
  { key: 'vip', type: 'boolean', label: 'VIP customer', group: 'General' },
  {
    key: 'amount',
    type: 'number-range',
    label: 'Amount',
    group: 'Amounts and dates',
  },
  {
    key: 'issued',
    type: 'date',
    label: 'Issued on',
    group: 'Amounts and dates',
  },
  {
    key: 'created',
    type: 'date-range',
    label: 'Created',
    group: 'Amounts and dates',
  },
];

function Demo({ initial = {} }: { initial?: FilterValues }) {
  const [value, setValue] = useState<FilterValues>(initial);
  return (
    <div className="gap-row flex flex-col">
      <FilterBar
        filters={filters}
        value={value}
        onChange={setValue}
        searchPlaceholder="Search invoices"
      />
      <p className="text-b3 text-text-muted break-all" dir="ltr">
        ?{serializeFilters(filters, value).toString()}
      </p>
    </div>
  );
}

function FromUrl() {
  const [value, setValue] = useState<FilterValues>(() =>
    parseFilters(
      filters,
      'q=hotel&status=sent&channel=web&channel=agent&amount_min=100&created_from=2025-01-01',
    ),
  );
  return <FilterBar filters={filters} value={value} onChange={setValue} />;
}

export const examples: Example[] = [
  {
    title: 'Default',
    description:
      'Search is debounced; the filters panel applies together. The URL form below round-trips through parseFilters.',
    wide: true,
    render: () => <Demo />,
  },
  {
    title: 'With active filters',
    description: 'Chips remove one value at a time; "Clear all" keeps the search text.',
    wide: true,
    render: () => <FromUrl />,
  },
  {
    title: 'Metadata loading',
    render: () => <FilterBar filters={[]} value={{}} onChange={() => {}} loading />,
  },
  {
    title: 'Metadata failed',
    render: () => (
      <FilterBar filters={[]} value={{}} onChange={() => {}} error onRetry={() => {}} />
    ),
  },
  {
    title: 'Search only',
    render: () => <FilterBar filters={[]} value={{}} onChange={() => {}} />,
  },
];

import { useEffect, useState } from 'react';
import { Combobox } from '@/components/ui/combobox';
import { Field } from '@/components/ui/field';
import type { ComboboxOption } from '@/lib/combobox-options';
import type { Example } from '../example-types';

const countries: ComboboxOption[] = [
  { value: 'eg', label: 'Egypt' },
  { value: 'iq', label: 'Iraq' },
  { value: 'jo', label: 'Jordan' },
  { value: 'kw', label: 'Kuwait' },
  { value: 'sa', label: 'Saudi Arabia' },
  { value: 'ae', label: 'United Arab Emirates', disabled: true },
];

const arabicCountries: ComboboxOption[] = [
  { value: 'eg', label: 'مصر' },
  { value: 'iq', label: 'العراق' },
  { value: 'jo', label: 'الأردن' },
  { value: 'sa', label: 'المملكة العربية السعودية' },
];

const PEOPLE: ComboboxOption[] = Array.from({ length: 47 }, (_, index) => ({
  value: String(index + 1),
  label: `Employee ${index + 1}`,
}));
const PAGE = 10;

/** Stands in for a server: filters by query and returns one page after a delay. */
function useFakeSearch(failFirst = false) {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      if (failFirst && attempt === 0) {
        setError(true);
      } else {
        const matches = PEOPLE.filter((person) =>
          person.label.toLowerCase().includes(query.toLowerCase()),
        );
        setOptions(matches.slice(0, limit));
        setHasMore(matches.length > limit);
        setError(false);
      }
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, limit, attempt, failFirst]);

  return {
    options,
    loading,
    error,
    hasMore,
    onSearchChange: (next: string) => {
      setQuery(next);
      setLimit(PAGE);
    },
    onLoadMore: () => setLimit((current) => current + PAGE),
    onRetry: () => setAttempt((current) => current + 1),
  };
}

function Remote() {
  const search = useFakeSearch();
  return (
    <Field label="Assignee" description="Searches on the server, 10 per page" className="w-72">
      <Combobox placeholder="Search employees" clearable {...search} />
    </Field>
  );
}

function Failing() {
  const search = useFakeSearch(true);
  return (
    <Field label="Assignee" className="w-72">
      <Combobox placeholder="First load fails" {...search} />
    </Field>
  );
}

function Controlled() {
  const [value, setValue] = useState<string | null>('jo');
  return (
    <Field label="Country" description={`Value: ${value ?? 'none'}`} className="w-72">
      <Combobox options={countries} value={value} onValueChange={setValue} clearable />
    </Field>
  );
}

export const examples: Example[] = [
  { title: 'Static options, controlled', render: () => <Controlled /> },
  {
    title: 'Async search with paging',
    description: 'Type to search; scroll to the end or press "Load more" for the next page.',
    render: () => <Remote />,
  },
  {
    title: 'Error state with retry',
    render: () => <Failing />,
  },
  {
    title: 'Saved value that is not in the first results',
    description: 'fallbackOptions supplies the label until the search returns it.',
    render: () => (
      <Field label="Owner" className="w-72">
        <Combobox
          options={[]}
          defaultValue="31"
          fallbackOptions={[{ value: '31', label: 'Employee 31' }]}
          onSearchChange={() => {}}
          placeholder="Search employees"
        />
      </Field>
    ),
  },
  {
    title: 'Disabled and invalid',
    render: () => (
      <>
        <Field label="Locked" className="w-64">
          <Combobox options={countries} defaultValue="eg" disabled />
        </Field>
        <Field label="Country" error="Choose a country" required className="w-64">
          <Combobox options={countries} placeholder="Select a country" />
        </Field>
      </>
    ),
  },
  {
    title: 'Arabic options',
    render: () => (
      <Field label="الدولة" className="w-72">
        <Combobox options={arabicCountries} placeholder="اختر دولة" clearable />
      </Field>
    ),
  },
];

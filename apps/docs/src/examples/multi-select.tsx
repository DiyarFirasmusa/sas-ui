import { useEffect, useState } from 'react';
import { Field } from '@/components/ui/field';
import { MultiSelect } from '@/components/ui/multi-select';
import type { ComboboxOption } from '@/lib/combobox-options';
import type { Example } from '../example-types';

const tags: ComboboxOption[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'billing', label: 'Billing' },
  { value: 'legal', label: 'Legal' },
  { value: 'support', label: 'Support' },
  { value: 'sales', label: 'Sales' },
  { value: 'archived', label: 'Archived', disabled: true },
];

const arabicTags: ComboboxOption[] = [
  { value: 'urgent', label: 'عاجل' },
  { value: 'billing', label: 'الفواتير' },
  { value: 'legal', label: 'الشؤون القانونية' },
  { value: 'support', label: 'الدعم' },
];

const PEOPLE: ComboboxOption[] = Array.from({ length: 42 }, (_, index) => ({
  value: String(index + 1),
  label: `Employee ${index + 1}`,
}));
const PAGE = 10;

/** Stands in for a server: filters by query and returns one page after a delay. */
function useFakeSearch() {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const matches = PEOPLE.filter((person) =>
        person.label.toLowerCase().includes(query.toLowerCase()),
      );
      setOptions(matches.slice(0, limit));
      setHasMore(matches.length > limit);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, limit]);

  return {
    options,
    loading,
    hasMore,
    onSearchChange: (next: string) => {
      setQuery(next);
      setLimit(PAGE);
    },
    onLoadMore: () => setLimit((current) => current + PAGE),
  };
}

function Remote() {
  const search = useFakeSearch();
  return (
    <Field
      label="Reviewers"
      description="Chosen people stay selected while you search"
      className="w-80"
    >
      <MultiSelect placeholder="Search employees" maxChips={3} clearable {...search} />
    </Field>
  );
}

function Controlled() {
  const [value, setValue] = useState<string[]>(['urgent', 'legal']);
  return (
    <Field label="Tags" description={`Selected: ${value.join(', ') || 'none'}`} className="w-80">
      <MultiSelect
        options={tags}
        value={value}
        onValueChange={setValue}
        placeholder="Add tags"
        clearable
      />
    </Field>
  );
}

export const examples: Example[] = [
  { title: 'Static options, controlled', render: () => <Controlled /> },
  {
    title: 'Overflow: first 2 chips, then +N',
    render: () => (
      <Field label="Tags" className="w-80">
        <MultiSelect
          options={tags}
          defaultValue={['urgent', 'billing', 'legal', 'support']}
          maxChips={2}
        />
      </Field>
    ),
  },
  {
    title: 'Async search with paging',
    render: () => <Remote />,
  },
  {
    title: 'Error state',
    render: () => (
      <Field label="Reviewers" className="w-80">
        <MultiSelect
          options={[]}
          onSearchChange={() => {}}
          error
          onRetry={() => {}}
          placeholder="Search"
        />
      </Field>
    ),
  },
  {
    title: 'Disabled and invalid',
    render: () => (
      <>
        <Field label="Locked" className="w-72">
          <MultiSelect options={tags} defaultValue={['billing']} disabled />
        </Field>
        <Field label="Tags" error="Pick at least one tag" required className="w-72">
          <MultiSelect options={tags} placeholder="Add tags" />
        </Field>
      </>
    ),
  },
  {
    title: 'Arabic options',
    render: () => (
      <Field label="الوسوم" className="w-80">
        <MultiSelect
          options={arabicTags}
          defaultValue={['urgent', 'legal']}
          placeholder="أضف وسومًا"
          clearable
        />
      </Field>
    ),
  },
];
